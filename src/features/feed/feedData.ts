export interface ThemeTokens {
  ink: string;
  inkSoft: string;
  inkFaint: string;
  modalBg: string;
  modalEdge: string;
  headerBg: string;
  cardBg: string;
  cardEdge: string;
  rowBg: string;
  rowEdge: string;
  badgeBg: string;
  badgeInk: string;
  tagBg: string;
  tagInk: string;
  accent: string;
  accentInk: string;
  like: string;
  sceneTop: string;
  sceneBottom: string;
  sceneHill: string;
  sceneCloud: string;
  sceneSun: string;
  deskBg: string;
}

export const THEMES: Record<string, ThemeTokens> = {
  "크림 당근": {
    ink: "#5A4733",
    inkSoft: "#A48E73",
    inkFaint: "#C6B59C",
    modalBg: "#F6EEE1",
    modalEdge: "#ECE0CD",
    headerBg: "#F6EEE1",
    cardBg: "#FFFDF8",
    cardEdge: "#ECE0CD",
    rowBg: "#FBF4E8",
    rowEdge: "#ECE0CD",
    badgeBg: "#FBE3CC",
    badgeInk: "#B26A3E",
    tagBg: "#EAE6F6",
    tagInk: "#8E81C0",
    accent: "#EE9A63",
    accentInk: "#FFFFFF",
    like: "#F2627A",
    sceneTop: "#BFE3F2",
    sceneBottom: "#DCEFCB",
    sceneHill: "#B7DD9C",
    sceneCloud: "#FFFFFF",
    sceneSun: "#FFE39A",
    deskBg: "#E9D7BB",
  },
  "민트 들판": {
    ink: "#33514A",
    inkSoft: "#85A79B",
    inkFaint: "#B3C9BF",
    modalBg: "#EAF6EC",
    modalEdge: "#C7E3CC",
    headerBg: "#E5F4E8",
    cardBg: "#FBFFFB",
    cardEdge: "#DBEEDD",
    rowBg: "#F0F8F0",
    rowEdge: "#D8ECDA",
    badgeBg: "#BFE6C9",
    badgeInk: "#3E7A55",
    tagBg: "#DCEEF0",
    tagInk: "#4E8E91",
    accent: "#56AC7A",
    accentInk: "#FFFFFF",
    like: "#EC6F8E",
    sceneTop: "#CFEFF0",
    sceneBottom: "#D7F0CF",
    sceneHill: "#AEDFA7",
    sceneCloud: "#FFFFFF",
    sceneSun: "#FFF0B8",
    deskBg: "#CFE6D2",
  },
  "라벤더 노을": {
    ink: "#4F4260",
    inkSoft: "#9D93B0",
    inkFaint: "#C3B9D2",
    modalBg: "#F6EFF8",
    modalEdge: "#E1D0E9",
    headerBg: "#F3E9F6",
    cardBg: "#FFFBFF",
    cardEdge: "#ECDDF0",
    rowBg: "#F6EFF8",
    rowEdge: "#E7D8EC",
    badgeBg: "#E7CFEC",
    badgeInk: "#8A5AA0",
    tagBg: "#F8DCE6",
    tagInk: "#B5658A",
    accent: "#B66BA6",
    accentInk: "#FFFFFF",
    like: "#E8617E",
    sceneTop: "#FAD9C8",
    sceneBottom: "#E6D2F0",
    sceneHill: "#D3BCE6",
    sceneCloud: "#FFF3F0",
    sceneSun: "#FFC98A",
    deskBg: "#DDCBE8",
  },
};

export const THEME_ORDER = ["크림 당근", "민트 들판", "라벤더 노을"] as const;
export type ThemeName = (typeof THEME_ORDER)[number];

export interface FeedComment {
  who: string;
  txt: string;
}

export interface FeedPostData {
  id: string;
  name: string;
  role: string;
  time: string;
  createdAt?: string;
  place: string;
  tint: string;
  caption: string[];
  quest: { label: string; value: string };
  tags: string[];
  likes: number;
  isLiked: boolean;
  comments: number;
  heroPlaceholder: string;
  imageUrl?: string;
  avatarUrl?: string;
  commentList: FeedComment[];
}
