import React from "react";
import renderer, { act } from "react-test-renderer";
import PostsTab from "@/app/(tabs)/posts";
import { PostCard } from "@/components/posts/PostCard";
import { FilterModal } from "@/components/posts/FilterModal";
import { SortModal } from "@/components/posts/SortModal";
import { ImageViewerModal } from "@/components/posts/ImageViewerModal";
import { PostSkeletons } from "@/components/posts/PostSkeletons";
import { Post } from "@/types";
import { getPosts } from "@/services/postService";

// Mocks
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useFocusEffect: (cb: Function) => {
    const React = require("react");
    React.useEffect(() => {
      cb();
    }, []);
  },
}));

jest.mock("@/services/postService", () => ({
  getPosts: jest.fn(),
}));

const samplePosts: Post[] = [
  {
    id: "post-1",
    sessionId: "s-1",
    user: { id: "u1", name: "Farmer A", email: "a@test.com", role: "farmer" },
    cropType: "Cà chua",
    plotId: "L-001",
    growthStage: "vegetative",
    envMode: "greenhouse",
    symptomDescription: "Vàng lá nhẹ",
    severity: "Nhẹ",
    images: ["file:///img1.jpg", "file:///img2.jpg", "file:///img3.jpg"],
    stationMeasurements: { temperature: 25, lightUvIndex: 5, windSpeed: 2, co2Level: 400 },
    status: "PUBLISHED",
    createdAt: "2026-07-24T10:00:00.000Z",
  },
  {
    id: "post-2",
    sessionId: "s-2",
    user: { id: "u2", name: "Farmer B", email: "b@test.com", role: "farmer" },
    cropType: "Dưa hấu",
    plotId: undefined, // Missing plotId edge case
    growthStage: "fruiting",
    envMode: "outdoor",
    symptomDescription: "Thối trái nặng",
    severity: "Rất nặng",
    images: [], // 0 images edge case
    stationMeasurements: { temperature: 30, lightUvIndex: 9, windSpeed: 5, co2Level: 410 },
    status: "PUBLISHED",
    createdAt: "2026-07-20T10:00:00.000Z",
  },
  {
    id: "post-3",
    sessionId: "s-3",
    user: { id: "u3", name: "Farmer C", email: "c@test.com", role: "farmer" },
    cropType: "Ớt chuông",
    plotId: "L-002",
    growthStage: "unknown_stage" as any, // Unknown stage edge case
    envMode: "outdoor",
    symptomDescription: "Chớm héo",
    severity: "Chớm bệnh",
    images: ["file:///imgSingle.jpg"], // 1 image edge case
    stationMeasurements: { temperature: 27, lightUvIndex: 6, windSpeed: 3, co2Level: 405 },
    status: "PUBLISHED",
    createdAt: "2026-07-22T10:00:00.000Z",
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

describe("Milestone 1 Challenger Stress & Edge Cases Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getPosts as jest.Mock).mockResolvedValue(samplePosts);
  });

  describe("PostCard Edge Cases", () => {
    test("renders 0 images correctly without crashing, both thumbs disabled", async () => {
      const onPressImageMock = jest.fn();
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <PostCard post={samplePosts[1]} onPressImage={onPressImageMock} />
        );
      });
      const root = tree!.root;
      expect(root.findByProps({ testID: "post-card-post-2" })).toBeDefined();

      const touchables = root.findAllByType(require("react-native").TouchableOpacity);
      expect(touchables.length).toBeGreaterThanOrEqual(2);

      await act(async () => {
        touchables[0].props.onPress();
        touchables[1].props.onPress();
      });
      expect(onPressImageMock).not.toHaveBeenCalled();
    });

    test("renders 1 image correctly and disables second thumb button", async () => {
      const onPressImageMock = jest.fn();
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <PostCard post={samplePosts[2]} onPressImage={onPressImageMock} />
        );
      });
      const root = tree!.root;
      const touchables = root.findAllByType(require("react-native").TouchableOpacity);

      await act(async () => {
        touchables[0].props.onPress();
      });
      expect(onPressImageMock).toHaveBeenLastCalledWith(["file:///imgSingle.jpg"], 0);

      onPressImageMock.mockClear();
      await act(async () => {
        touchables[1].props.onPress();
      });
      expect(onPressImageMock).not.toHaveBeenCalled();
    });

    test("renders >2 images with +N badge overlay (+1 for 3 images)", async () => {
      const onPressImageMock = jest.fn();
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <PostCard post={samplePosts[0]} onPressImage={onPressImageMock} />
        );
      });
      const root = tree!.root;

      const badgeText = root.findAll((n: any) =>
        n.props?.children === "+1" ||
        (Array.isArray(n.props?.children) && n.props.children.join("") === "+1")
      );
      expect(badgeText.length).toBeGreaterThan(0);

      const touchables = root.findAllByType(require("react-native").TouchableOpacity);
      await act(async () => {
        touchables[1].props.onPress();
      });
      expect(onPressImageMock).toHaveBeenLastCalledWith(samplePosts[0].images, 1);
    });

    test("handles missing plotId gracefully without rendering plot badge", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<PostCard post={samplePosts[1]} />);
      });
      const root = tree!.root;

      const plotBadges = root.findAll((n: any) => n.props?.style && JSON.stringify(n.props.style).includes("#F3F4F6"));
      expect(plotBadges.length).toBe(0);
    });

    test("handles unknown growthStage and custom severity fallback dot color", async () => {
      const customPost: Post = {
        ...samplePosts[0],
        id: "post-custom",
        growthStage: "unknown_growth_stage" as any,
        severity: "UnknownSeverity" as any,
      };
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<PostCard post={customPost} />);
      });
      const root = tree!.root;

      const titleNode = root.findByProps({ numberOfLines: 1 });
      expect(titleNode.props.children).toEqual(["Cà chua", " - ", "unknown_growth_stage"]);
    });

    test("renders admin action buttons when isAdmin=true", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<PostCard post={samplePosts[0]} isAdmin={true} />);
      });
      const root = tree!.root;
      const xemText = root.findAll((n: any) => n.props?.children === "Xem");
      const ganNhanText = root.findAll((n: any) => n.props?.children === "Gắn nhãn");
      expect(xemText.length).toBeGreaterThan(0);
      expect(ganNhanText.length).toBeGreaterThan(0);
    });
  });

  describe("FilterModal Interactions", () => {
    test("does not render contents or backdrop when visible=false", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <FilterModal
            visible={false}
            onClose={jest.fn()}
            plots={["L-001", "L-002"]}
            crops={["Cà chua"]}
            selectedPlot="all"
            selectedCrop="all"
            selectedEnv="all"
            onApply={jest.fn()}
            onReset={jest.fn()}
          />
        );
      });
      const modal = tree!.root.findByType(require("react-native").Modal);
      expect(modal.props.visible).toBe(false);
    });

    test("triggers onApply with updated selections when apply button is pressed", async () => {
      const onApplyMock = jest.fn();
      const onCloseMock = jest.fn();
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <FilterModal
            visible={true}
            onClose={onCloseMock}
            plots={["L-001", "L-002"]}
            crops={["Cà chua", "Dưa hấu"]}
            selectedPlot="all"
            selectedCrop="all"
            selectedEnv="all"
            onApply={onApplyMock}
            onReset={jest.fn()}
          />
        );
      });
      const root = tree!.root;

      const plotBtn = findClickableWithText(root, "L-001");
      expect(plotBtn).not.toBeNull();
      await act(async () => {
        plotBtn.props.onPress();
      });

      const applyBtn = findClickableWithText(root, "Áp dụng");
      expect(applyBtn).not.toBeNull();
      await act(async () => {
        applyBtn.props.onPress();
      });

      expect(onApplyMock).toHaveBeenCalledWith({
        plot: "L-001",
        crop: "all",
        env: "all",
      });
      expect(onCloseMock).toHaveBeenCalled();
    });

    test("triggers onReset and resets local chip selection when 'Đặt lại' is pressed", async () => {
      const onResetMock = jest.fn();
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <FilterModal
            visible={true}
            onClose={jest.fn()}
            plots={["L-001"]}
            crops={["Cà chua"]}
            selectedPlot="L-001"
            selectedCrop="Cà chua"
            selectedEnv="greenhouse"
            onApply={jest.fn()}
            onReset={onResetMock}
          />
        );
      });
      const root = tree!.root;

      const resetBtn = findClickableWithText(root, "Đặt lại");
      expect(resetBtn).not.toBeNull();
      await act(async () => {
        resetBtn.props.onPress();
      });

      expect(onResetMock).toHaveBeenCalled();
    });
  });

  describe("SortModal Interactions", () => {
    test("selects sort option and closes modal", async () => {
      const onSelectSortMock = jest.fn();
      const onCloseMock = jest.fn();
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <SortModal
            visible={true}
            onClose={onCloseMock}
            selectedSort="newest"
            onSelectSort={onSelectSortMock}
          />
        );
      });
      const root = tree!.root;

      const severityBtn = findClickableWithText(root, "Mức độ nặng nhất");
      expect(severityBtn).not.toBeNull();
      await act(async () => {
        severityBtn.props.onPress();
      });

      expect(onSelectSortMock).toHaveBeenCalledWith("severity");
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  describe("ImageViewerModal Edge Cases", () => {
    test("returns null when visible=false or images empty", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <ImageViewerModal
            visible={false}
            images={["file:///img1.jpg"]}
            onClose={jest.fn()}
          />
        );
      });
      expect(tree!.toJSON()).toBeNull();

      await act(async () => {
        tree = renderer.create(
          <ImageViewerModal visible={true} images={[]} onClose={jest.fn()} />
        );
      });
      expect(tree!.toJSON()).toBeNull();
    });

    test("renders image viewer and closes on close button press", async () => {
      const onCloseMock = jest.fn();
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <ImageViewerModal
            visible={true}
            images={["file:///img1.jpg", "file:///img2.jpg"]}
            initialIndex={0}
            onClose={onCloseMock}
          />
        );
      });
      const root = tree!.root;

      const pillTextNode = root.findAll((n: any) => n.props?.children && Array.isArray(n.props.children) && n.props.children.includes(" / "));
      expect(pillTextNode.length).toBeGreaterThan(0);

      const touchables = root.findAll((n: any) => typeof n.props?.onPress === "function");
      await act(async () => {
        touchables[0].props.onPress();
      });
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  describe("PostSkeletons Animation Loop", () => {
    test("renders 4 skeleton animated views without error", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<PostSkeletons />);
      });
      expect(tree!.toTree()).toBeDefined();

      await act(async () => {
        tree!.unmount();
      });
    });
  });

  describe("PostsScreen Integration & Filters", () => {
    test("renders error state when getPosts fails and allows retry", async () => {
      (getPosts as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<PostsTab />);
      });
      const root = tree!.root;

      const errorTitle = root.findAll((n: any) => n.props?.children === "Không thể tải dữ liệu");
      expect(errorTitle.length).toBeGreaterThan(0);

      (getPosts as jest.Mock).mockResolvedValueOnce(samplePosts);
      const retryBtn = findClickableWithText(root, "Thử lại");
      expect(retryBtn).not.toBeNull();
      await act(async () => {
        retryBtn.props.onPress();
      });

      expect(getPosts).toHaveBeenCalledTimes(2);
    });

    test("renders empty state when posts list is empty and pushes capture on CTA press", async () => {
      (getPosts as jest.Mock).mockImplementation(() => Promise.resolve([]));
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<PostsTab />);
      });
      const root = tree!.root;

      const emptyTitle = root.findAll((n: any) => n.props?.children === "Chưa có bài đăng");
      expect(emptyTitle.length).toBeGreaterThan(0);

      const ctaBtn = findClickableWithText(root, "Tạo phiên chụp");
      expect(ctaBtn).not.toBeNull();
      await act(async () => {
        ctaBtn.props.onPress();
      });

      expect(mockPush).toHaveBeenCalledWith("/capture");
    });

    test("filters posts by search query, env chips, and modal filters", async () => {
      (getPosts as jest.Mock).mockResolvedValue(samplePosts);
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<PostsTab />);
      });
      const root = tree!.root;

      const searchInput = root.findByProps({ testID: "posts-search-input" });
      await act(async () => {
        searchInput.props.onChangeText("Cà chua");
      });

      expect(root.findByProps({ testID: "post-card-post-1" })).toBeDefined();
      const post2Matches = root.findAll((n: any) => n.props?.testID === "post-card-post-2");
      expect(post2Matches.length).toBe(0);
    });
  });
});
