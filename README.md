# 몽글마을 Web

> AI 주민과 함께 TODO를 퀘스트로 수행하는 픽셀 마을형 자기관리 웹 서비스

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Phaser](https://img.shields.io/badge/Phaser-3.90-8A2BE2)](https://phaser.io/)

<p align="center">
  <img src="public/assets/tutorial/village.png" alt="몽글마을 메인 화면" width="88%" />
</p>

<p align="center">
  <img src="public/assets/tutorial/planner_chat.png" alt="AI 플래너 대화 화면" width="43%" />
  <img src="public/assets/tutorial/feed_list.png" alt="AI 주민 피드 화면" width="40%" />
</p>

## 프로젝트 개요

몽글마을은 사용자의 애착 인형을 AI 주민으로 만들고, 자연어로 입력한 목표를 TODO와 캐릭터 퀘스트로 구체화하는 서비스입니다. Web은 React 인터페이스와 Phaser 마을을 하나의 화면에 결합하고, 시간이 오래 걸리는 AI 생성 작업을 사용자가 안전하게 이어갈 수 있도록 관리합니다.

- React가 로그인, TODO, 캘린더, 피드, 회고 등 제품 UI를 담당합니다.
- Phaser가 Tiled 기반의 픽셀 마을 배경을 렌더링합니다.
- Zustand가 인증과 알림 등 클라이언트 상태를 관리합니다.
- Django API와 AI 비동기 작업 상태를 연결합니다.

| 영역 | 저장소 |
| --- | --- |
| Web | **현재 저장소** |
| Server | [mongle-server](https://github.com/bigmooon/mongle-server) |
| AI | [mongle-ai](https://github.com/bigmooon/mongle-ai) |

## 주요 사용자 경험

1. 이메일 또는 카카오 계정으로 로그인합니다.
2. 애착 인형 사진과 키워드로 AI 주민을 생성합니다.
3. 한 문장 목표를 바로 TODO로 나누거나, AI 플래너와 대화해 장기 계획을 구체화합니다.
4. TODO를 캘린더와 태그로 관리하고 캐릭터 퀘스트로 연결합니다.
5. 완료한 퀘스트는 AI 이미지와 캡션이 포함된 피드로 이어집니다.
6. 포모도로와 일일 회고로 실행 과정을 기록합니다.

## 담당한 부분

기능 구현뿐 아니라 화면 구조, API 연동, 비동기 상태 복구와 품질 자동화를 함께 담당했습니다. 아래 항목은 병합된 PR로 확인할 수 있습니다.

- **품질 기반**: Biome, TypeScript 검사와 CI 흐름을 구성했습니다. ([#3](https://github.com/mong-studio/mongle-web/pull/3))
- **인증 경험**: 로그인·세션 처리와 카카오 로그인을 구현했습니다. ([#9](https://github.com/mong-studio/mongle-web/pull/9), [#100](https://github.com/mong-studio/mongle-web/pull/100))
- **화면 구조**: 기능 단위 디렉터리와 공용 모듈 경계를 정리했습니다. ([#32](https://github.com/mong-studio/mongle-web/pull/32), [#38](https://github.com/mong-studio/mongle-web/pull/38))
- **AI 작업 UX**: 캐릭터 생성의 비동기 처리와 새로고침 이후 pending job 복구를 구현했습니다. ([#61](https://github.com/mong-studio/mongle-web/pull/61))
- **TODO·캘린더**: 태그 기반 일정과 TODO 화면을 구현했습니다. ([#76](https://github.com/mong-studio/mongle-web/pull/76), [#104](https://github.com/mong-studio/mongle-web/pull/104), [#175](https://github.com/mong-studio/mongle-web/pull/175))
- **피드 안정성**: 좋아요 동기화와 댓글 입력 정책을 테스트 가능한 규칙으로 분리했습니다. ([#132](https://github.com/mong-studio/mongle-web/pull/132))
- **온보딩**: 실제 서비스 화면을 따라가는 튜토리얼을 추가했습니다. ([#155](https://github.com/mong-studio/mongle-web/pull/155))

## 기술적 선택

| 문제 | 선택 | 이유 |
| --- | --- | --- |
| 정보 UI와 게임형 공간을 함께 표현 | React UI + Phaser Canvas | 폼·모달의 생산성과 픽셀 마을 렌더링을 동시에 확보하기 위해 |
| 기능 증가에 따른 결합도 | `features/` 중심 구조 | 인증·캘린더·피드 등 도메인 변경 범위를 제한하기 위해 |
| AI 생성 중 새로고침·지연 | Submit/Poll + pending job 복구 | 장시간 요청의 타임아웃과 작업 유실을 줄이기 위해 |
| Refresh 쿠키의 브라우저 정책 | same-origin API + Vite proxy | 개발 환경에서도 실제 쿠키 조건과 가깝게 동작시키기 위해 |
| 피드의 낙관적 상호작용 | 서버 응답과 로컬 상태 동기화 | 좋아요·댓글 수가 화면마다 달라지는 문제를 줄이기 위해 |

## 검증 결과

2026-10-10 로컬 환경에서 다음 항목을 확인했습니다.

| 검증 | 결과 |
| --- | --- |
| Vitest | 121 tests passed |
| TypeScript | `tsc --noEmit` 통과 |
| Production build | 통과 |
| Biome | unused import 경고 2건 확인 |

CI workflow는 Biome, 타입 검사, 테스트와 프로덕션 빌드를 순서대로 실행하도록 구성되어 있습니다.

## 빠른 시작

### 요구 환경

- Node.js 24 권장 — CI 기준
- npm 10+

```bash
git clone https://github.com/bigmooon/mongle-web.git
cd mongle-web
cp .env.example .env
npm ci
npm run dev
```

브라우저에서 `http://127.0.0.1:5173`을 엽니다. `VITE_API_BASE`를 비워 두면 `/api` 요청은 개발 프록시를 통해 `http://127.0.0.1:8000`으로 전달됩니다.

### 환경 변수

| 이름 | 용도 |
| --- | --- |
| `VITE_API_BASE` | API 호스트. 비워 두면 same-origin 사용 |
| `VITE_KAKAO_JS_KEY` | Kakao JavaScript SDK 키 |
| `VITE_KAKAO_CLIENT_ID` | Kakao REST API 앱 키 |
| `VITE_KAKAO_REDIRECT_URI` | OAuth 콜백 URL |

### 검증

```bash
npm run check
npm run typecheck
npm run test
npm run build
```

## 구조

```text
src/
├── app/                  앱 셸과 기능 레지스트리
├── features/
│   ├── auth/             로그인·회원가입·카카오 인증
│   ├── calendar/         일정·태그·날짜 UI
│   ├── character/        AI 주민 생성과 작업 폴링
│   ├── feed/             게시물·댓글·공유
│   ├── planner-chat/     멀티턴 AI 플래너
│   ├── reflection/       일일 회고
│   ├── todo/             TODO와 퀘스트 UI
│   └── village/          Phaser 마을 화면
└── shared/               공용 API와 UI
```

상세한 설치·구조·품질 규칙은 [`docs/`](docs/)에서 확인할 수 있습니다.

## 배포

`main`의 Web 코드가 변경되면 GitHub Actions가 앱을 빌드해 S3에 동기화하고 CloudFront 캐시를 무효화합니다. AWS 인증은 장기 키 대신 GitHub OIDC 역할을 사용합니다.

## 한계와 다음 과제

- 초기 JavaScript 번들이 커서 기능 단위 lazy loading이 필요합니다.
- 일부 Phaser 상호작용은 임시 클릭 지점을 사용합니다.
- 플레이어 이동, 충돌, 오디오와 멀티플레이는 현재 범위에 포함되지 않습니다.
- 접근성과 모바일 레이아웃에 대한 별도 E2E 검증이 필요합니다.
