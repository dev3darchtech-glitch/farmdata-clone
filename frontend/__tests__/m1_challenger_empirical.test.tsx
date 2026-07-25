import React from "react";
import renderer, { act } from "react-test-renderer";
import PostsScreen from "@/app/(tabs)/posts";
import { getPosts } from "@/services/postService";
import { Post } from "@/types";

// Mock router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useFocusEffect: (cb: Function) => {
    const React = require("react");
    React.useEffect(() => {
      cb();
    }, []);
  },
}));

// Mock postService
jest.mock("@/services/postService", () => ({
  getPosts: jest.fn(),
}));

const mockGetPosts = getPosts as jest.MockedFunction<typeof getPosts>;

const SAMPLE_POSTS: Post[] = [
  {
    id: "post-1",
    sessionId: "s1",
    user: { id: "u1", name: "Farmer A", email: "a@test.com", role: "farmer" },
    cropType: "Cà chua",
    plotId: "L-002",
    growthStage: "vegetative",
    envMode: "greenhouse",
    symptomDescription: "Vàng lá nhè nhẹ",
    severity: "Nhẹ",
    images: ["file:///img1.jpg"],
    stationMeasurements: { temperature: 25, lightUvIndex: 5, windSpeed: 2, co2Level: 400 },
    status: "PUBLISHED",
    createdAt: "2026-07-24T10:00:00.000Z",
  },
  {
    id: "post-2",
    sessionId: "s2",
    user: { id: "u2", name: "Farmer B", email: "b@test.com", role: "farmer" },
    cropType: "Dưa hấu",
    plotId: "L-001",
    growthStage: "fruiting",
    envMode: "outdoor",
    symptomDescription: "Đốm lá nặng",
    severity: "Rất nặng",
    images: ["file:///img2.jpg", "file:///img3.jpg", "file:///img4.jpg"],
    stationMeasurements: { temperature: 30, lightUvIndex: 9, windSpeed: 15, co2Level: 410 },
    status: "PUBLISHED",
    createdAt: "2026-07-24T14:00:00.000Z",
  },
  {
    id: "post-3",
    sessionId: "s3",
    user: { id: "u1", name: "Farmer A", email: "a@test.com", role: "farmer" },
    cropType: "Cà chua",
    plotId: undefined, // test missing plotId
    growthStage: "flowering",
    envMode: "outdoor",
    symptomDescription: "Héo rũ vừa",
    severity: "Vừa",
    images: ["file:///img5.jpg"],
    stationMeasurements: { temperature: 22, lightUvIndex: 4, windSpeed: 5, co2Level: 390 },
    status: "PUBLISHED",
    createdAt: "2026-07-24T08:00:00.000Z",
  },
];

function findClickableWithText(root: any, text: string) {
  const allTexts = root.findAll((n: any) =>
    n.props?.children === text || (Array.isArray(n.props?.children) && n.props.children.includes(text))
  );
  for (const t of allTexts) {
    let curr = t.parent;
    while (curr) {
      if (curr.props && typeof curr.props.onPress === "function") {
        return curr;
      }
      curr = curr.parent;
    }
  }
  return null;
}

function getRenderedCardIds(root: any): string[] {
  const elements = root.findAll((n: any) => typeof n.props?.testID === "string" && n.props.testID.startsWith("post-card-"));
  const ids: string[] = [];
  elements.forEach((el: any) => {
    const id = el.props.testID.replace("post-card-", "");
    if (!ids.includes(id)) {
      ids.push(id);
    }
  });
  return ids;
}

describe("Challenger 1 - Empirical Tests for Milestone 1", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("1. Filter logic: Environment chips filter feed correctly", async () => {
    mockGetPosts.mockResolvedValue(SAMPLE_POSTS);

    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<PostsScreen />);
    });

    const root = tree!.root;

    expect(root.findByProps({ testID: "post-card-post-1" })).toBeDefined();
    expect(root.findByProps({ testID: "post-card-post-2" })).toBeDefined();
    expect(root.findByProps({ testID: "post-card-post-3" })).toBeDefined();

    const outdoorChip = findClickableWithText(root, "Ngoài trời");
    expect(outdoorChip).not.toBeNull();

    await act(async () => {
      outdoorChip.props.onPress();
    });

    const post1Matches = root.findAll((n: any) => n.props?.testID === "post-card-post-1");
    expect(post1Matches.length).toBe(0);
    expect(root.findByProps({ testID: "post-card-post-2" })).toBeDefined();
    expect(root.findByProps({ testID: "post-card-post-3" })).toBeDefined();

    const greenhouseChip = findClickableWithText(root, "Nhà kính");
    expect(greenhouseChip).not.toBeNull();

    await act(async () => {
      greenhouseChip.props.onPress();
    });

    expect(root.findByProps({ testID: "post-card-post-1" })).toBeDefined();
    const post2Matches = root.findAll((n: any) => n.props?.testID === "post-card-post-2");
    expect(post2Matches.length).toBe(0);
  });

  test("2. Search logic: queries filter by plot code, crop type, and symptom description", async () => {
    mockGetPosts.mockResolvedValue(SAMPLE_POSTS);

    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<PostsScreen />);
    });

    const root = tree!.root;
    const searchInput = root.findByProps({ testID: "posts-search-input" });

    await act(async () => {
      searchInput.props.onChangeText("Dưa hấu");
    });
    expect(root.findAll((n: any) => n.props?.testID === "post-card-post-1").length).toBe(0);
    expect(root.findByProps({ testID: "post-card-post-2" })).toBeDefined();
    expect(root.findAll((n: any) => n.props?.testID === "post-card-post-3").length).toBe(0);

    await act(async () => {
      searchInput.props.onChangeText("L-002");
    });
    expect(root.findByProps({ testID: "post-card-post-1" })).toBeDefined();
    expect(root.findAll((n: any) => n.props?.testID === "post-card-post-2").length).toBe(0);
    expect(root.findAll((n: any) => n.props?.testID === "post-card-post-3").length).toBe(0);

    await act(async () => {
      searchInput.props.onChangeText("Héo rũ");
    });
    expect(root.findAll((n: any) => n.props?.testID === "post-card-post-1").length).toBe(0);
    expect(root.findAll((n: any) => n.props?.testID === "post-card-post-2").length).toBe(0);
    expect(root.findByProps({ testID: "post-card-post-3" })).toBeDefined();

    await act(async () => {
      searchInput.props.onChangeText("NonExistentQueryXYZ");
    });
    expect(root.findAll((n: any) => n.props?.testID === "post-card-post-1").length).toBe(0);
    expect(root.findAll((n: any) => n.props?.testID === "post-card-post-2").length).toBe(0);
    expect(root.findAll((n: any) => n.props?.testID === "post-card-post-3").length).toBe(0);
  });

  test("3. Empty State: renders when posts list is empty and CTA triggers navigation", async () => {
    mockGetPosts.mockResolvedValue([]);

    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<PostsScreen />);
    });

    const root = tree!.root;

    const emptyTitle = root.findAll((n: any) => n.props?.children === "Chưa có bài đăng");
    expect(emptyTitle.length).toBeGreaterThan(0);

    const btnTouchable = findClickableWithText(root, "Tạo phiên chụp");
    expect(btnTouchable).not.toBeNull();
    await act(async () => {
      btnTouchable.props.onPress();
    });

    expect(mockPush).toHaveBeenCalledWith("/capture");
  });

  test("4. Offline Retry: renders network error state and retry button re-fetches feed", async () => {
    mockGetPosts.mockRejectedValueOnce(new Error("Network disconnect"));

    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<PostsScreen />);
    });

    const root = tree!.root;

    const errorTitle = root.findAll((n: any) => n.props?.children === "Không thể tải dữ liệu");
    expect(errorTitle.length).toBeGreaterThan(0);

    mockGetPosts.mockResolvedValueOnce(SAMPLE_POSTS);

    const retryTouchable = findClickableWithText(root, "Thử lại");
    expect(retryTouchable).not.toBeNull();

    await act(async () => {
      retryTouchable.props.onPress();
    });

    expect(root.findByProps({ testID: "post-card-post-1" })).toBeDefined();
    expect(root.findByProps({ testID: "post-card-post-2" })).toBeDefined();
  });

  test("5. Sort options: Mới nhất, Cũ nhất, Mức độ nặng nhất, Mã luống A → Z", async () => {
    mockGetPosts.mockResolvedValue(SAMPLE_POSTS);

    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<PostsScreen />);
    });

    const root = tree!.root;

    const sortBtn = findClickableWithText(root, "≡↑");
    expect(sortBtn).not.toBeNull();
    await act(async () => {
      sortBtn.props.onPress();
    });

    const severityOption = findClickableWithText(root, "Mức độ nặng nhất");
    expect(severityOption).not.toBeNull();

    await act(async () => {
      severityOption.props.onPress();
    });

    const cardIds = getRenderedCardIds(root);
    expect(cardIds[0]).toBe("post-2");
    expect(cardIds[1]).toBe("post-3");
    expect(cardIds[2]).toBe("post-1");
  });
});
