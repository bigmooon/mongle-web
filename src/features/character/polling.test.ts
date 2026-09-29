import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../../shared/api/client.js";
import { generateCharacterPreview, resumePendingCharacter } from "./api.js";
import { loadPendingJob, savePendingJob } from "./pendingJob.js";

const params = { name: "몽이", persona: "차분한 친구", personalityKeywords: [] };
const pending = { jobId: "job-1", name: params.name, persona: params.persona };
let states: string[], latency: number, concurrent: number, peak: number;
let requests: Array<{ start: number; end?: number; state: string }>;
const originalAdapter = apiClient.defaults.adapter;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  localStorage.clear();
  states = ["QUEUED", "IN_PROGRESS", "SUCCEEDED"];
  latency = 100;
  requests = [];
  concurrent = 0;
  peak = 0;
  apiClient.defaults.adapter = async (config) => {
    if (config.method === "post")
      return {
        data:
          config.url === "/characters/"
            ? { character_id: "resident-1", name: params.name }
            : { job_id: pending.jobId, status: "QUEUED", estimated_seconds: 30 },
        status: 202,
        statusText: "Accepted",
        headers: {},
        config,
      };
    const state = states.length > 1 ? (states.shift() ?? "IN_PROGRESS") : states[0];
    const entry = { start: Date.now(), state, end: undefined as number | undefined };
    requests.push(entry);
    concurrent++;
    peak = Math.max(peak, concurrent);
    return new Promise((resolve, reject) => {
      let finished = false;
      const finish = () => {
        if (finished) return false;
        finished = true;
        clearTimeout(timer);
        config.signal?.removeEventListener?.("abort", abort);
        concurrent--;
        entry.end = Date.now();
        return true;
      };
      const abort = () => {
        if (finish()) reject(new axios.CanceledError());
      };
      const timer = setTimeout(() => {
        if (!finish()) return;
        if (["500", "network", "timeout"].includes(state))
          reject(
            new axios.AxiosError(
              `injected ${state}`,
              state === "timeout" ? "ECONNABORTED" : "ERR_NETWORK",
              config,
              undefined,
              state === "500"
                ? { data: {}, status: 500, statusText: "error", headers: {}, config }
                : undefined,
            ),
          );
        else
          resolve({
            data: {
              job_id: pending.jobId,
              status: state,
              result:
                state === "SUCCEEDED"
                  ? { gen_img_url: "https://example.test/mock.png", persona: params.persona }
                  : null,
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
          });
      }, latency);
      config.signal?.addEventListener?.("abort", abort);
      if (config.signal?.aborted) abort();
    });
  };
});
afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  vi.useRealTimers();
  localStorage.clear();
  vi.restoreAllMocks();
});
const settle = <T>(promise: Promise<T>) =>
  promise.then(
    (value) => ({ value, error: undefined }),
    (error) => ({ value: undefined, error }),
  );
describe("character polling lifecycle", () => {
  it("success stops after QUEUED -> IN_PROGRESS -> SUCCEEDED", async () => {
    const result = settle(generateCharacterPreview(params));
    await vi.advanceTimersByTimeAsync(15000);
    expect((await result).value?.jobId).toBe(pending.jobId);
    expect(requests.map((r) => r.state)).toEqual(["QUEUED", "IN_PROGRESS", "SUCCEEDED"]);
    expect(peak).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
    console.log("SUCCESS TRACE", JSON.stringify(requests));
  });
  it("FAILED stops with a user-facing error", async () => {
    states = ["QUEUED", "IN_PROGRESS", "FAILED"];
    const result = settle(generateCharacterPreview(params));
    await vi.advanceTimersByTimeAsync(15000);
    expect((await result).error?.message).toContain("실패");
    expect(requests).toHaveLength(3);
    expect(loadPendingJob()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    console.log("FAILED TRACE", JSON.stringify(requests));
  });
  it("long job keeps one request/timer path for 60 seconds", async () => {
    states = ["IN_PROGRESS"];
    const result = settle(generateCharacterPreview(params));
    await vi.advanceTimersByTimeAsync(60000);
    expect(requests).toHaveLength(29);
    expect(peak).toBe(1);
    expect(vi.getTimerCount()).toBeLessThanOrEqual(2);
    states = ["SUCCEEDED"];
    await vi.advanceTimersByTimeAsync(3000);
    expect((await result).value?.jobId).toBe(pending.jobId);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("slow 4-second responses do not overlap", async () => {
    latency = 4000;
    const result = settle(generateCharacterPreview(params));
    await vi.advanceTimersByTimeAsync(20000);
    expect((await result).value).toBeDefined();
    expect(requests.map((r) => r.start)).toEqual([0, 6000, 12000]);
    expect(peak).toBe(1);
  });
  it("abort releases in-flight request and preserves recovery", async () => {
    latency = 10000;
    const controller = new AbortController();
    const result = settle(generateCharacterPreview(params, { signal: controller.signal }));
    await vi.advanceTimersByTimeAsync(100);
    controller.abort();
    await vi.advanceTimersByTimeAsync(0);
    expect(concurrent).toBe(0);
    expect((await result).error?.name).toBe("AbortError");
    expect(loadPendingJob()?.jobId).toBe(pending.jobId);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("abort clears sleeping timer immediately", async () => {
    const controller = new AbortController();
    const result = settle(generateCharacterPreview(params, { signal: controller.signal }));
    await vi.advanceTimersByTimeAsync(200);
    controller.abort();
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.getTimerCount()).toBe(0);
    expect((await result).error?.name).toBe("AbortError");
    expect(requests).toHaveLength(1);
  });
  it("refresh resumes without submit or automatic registration", async () => {
    savePendingJob(pending);
    const post = vi.spyOn(apiClient, "post");
    const result = settle(resumePendingCharacter());
    await vi.advanceTimersByTimeAsync(15000);
    expect(post).not.toHaveBeenCalled();
    expect((await result).value).toMatchObject({ jobId: pending.jobId });
  });
  it.each(["500", "network", "timeout"])("transient %s retries then succeeds", async (failure) => {
    states = [failure, "IN_PROGRESS", "SUCCEEDED"];
    const result = settle(generateCharacterPreview(params));
    await vi.advanceTimersByTimeAsync(15000);
    expect((await result).value?.jobId).toBe(pending.jobId);
    expect(requests).toHaveLength(3);
  });
  it("persistent network errors stop after 3 attempts and retain pending", async () => {
    savePendingJob(pending);
    states = ["500"];
    const result = settle(resumePendingCharacter());
    await vi.advanceTimersByTimeAsync(15000);
    expect((await result).error).toBeDefined();
    expect(requests).toHaveLength(3);
    expect(loadPendingJob()?.jobId).toBe(pending.jobId);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("duplicate observers do not start concurrent loops", async () => {
    savePendingJob(pending);
    const first = settle(resumePendingCharacter());
    const second = settle(resumePendingCharacter());
    await vi.advanceTimersByTimeAsync(15000);
    await Promise.all([first, second]);
    expect(peak).toBe(1);
    expect(requests).toHaveLength(3);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("hung status request stops at overall deadline", async () => {
    latency = 1000000;
    const result = settle(generateCharacterPreview(params));
    let completed = false;
    void result.then(() => {
      completed = true;
    });
    await vi.advanceTimersByTimeAsync(360001);
    expect(completed).toBe(true);
    expect((await result).error?.message).toContain("오래");
    expect(concurrent).toBe(0);
    expect(loadPendingJob()?.jobId).toBe(pending.jobId);
  });
  it("repeated pending responses stop at 360 seconds and preserve recovery", async () => {
    states = ["IN_PROGRESS"];
    const result = settle(generateCharacterPreview(params));
    await vi.advanceTimersByTimeAsync(360001);
    expect((await result).error?.message).toContain("오래");
    expect(requests).toHaveLength(172);
    expect(vi.getTimerCount()).toBe(0);
    expect(loadPendingJob()?.jobId).toBe(pending.jobId);
  });
  it("CONSUMED never becomes an empty preview", async () => {
    states = ["CONSUMED"];
    const result = settle(generateCharacterPreview(params));
    await vi.advanceTimersByTimeAsync(5000);
    expect((await result).value).toBeUndefined();
    expect((await result).error?.message).toContain("이미");
    expect(requests).toHaveLength(1);
    expect(loadPendingJob()).toBeNull();
  });
  it("success between errors resets consecutive retry count", async () => {
    states = ["500", "500", "IN_PROGRESS", "network", "network", "SUCCEEDED"];
    const result = settle(generateCharacterPreview(params));
    await vi.advanceTimersByTimeAsync(20000);
    expect((await result).value?.jobId).toBe(pending.jobId);
    expect(requests).toHaveLength(6);
  });
  it("404 on recovery is not retried and clears the missing job", async () => {
    savePendingJob(pending);
    const get = vi
      .spyOn(apiClient, "get")
      .mockRejectedValue(
        new axios.AxiosError("not found", "404", undefined, undefined, { status: 404 } as never),
      );
    const result = await settle(resumePendingCharacter());
    await vi.advanceTimersByTimeAsync(0);
    expect(result.error).toBeDefined();
    expect(get).toHaveBeenCalledTimes(1);
    expect(loadPendingJob()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("already aborted generation never submits a job", async () => {
    const controller = new AbortController();
    controller.abort();
    const post = vi.spyOn(apiClient, "post");
    const result = await settle(generateCharacterPreview(params, { signal: controller.signal }));
    expect(result.error?.name).toBe("AbortError");
    expect(post).not.toHaveBeenCalled();
  });
  it("unknown external status stops without inventing a backend state", async () => {
    states = ["UNRECOGNIZED"];
    const result = settle(generateCharacterPreview(params));
    await vi.advanceTimersByTimeAsync(5000);
    expect((await result).error?.message).toContain("알 수 없는");
    expect(requests).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(loadPendingJob()?.jobId).toBe(pending.jobId);
  });
});
