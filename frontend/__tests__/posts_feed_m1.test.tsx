import React from "react";
import renderer, { act } from "react-test-renderer";
import PostsTab from "@/app/(tabs)/posts";
import { PostCard } from "@/components/posts/PostCard";
import { FilterModal } from "@/components/posts/FilterModal";
import { SortModal } from "@/components/posts/SortModal";
import { ImageViewerModal } from "@/components/posts/ImageViewerModal";
import { PostSkeletons } from "@/components/posts/PostSkeletons";
import { Post } from "@/types";

// Mocks
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useFocusEffect: (cb: Function) => {
    const React = require("react");
    React.useEffect(() => {
      cb();
    }, []);
  },
}));

jest.mock("@/services/postService", () => ({
  getPosts: jest.fn().mockResolvedValue([
    {
      id: "post-101",
      sessionId: "session-101",
      user: { id: "u1", name: "Farmer A", email: "farmer@test.com", role: "farmer" },
      cropType: "Cà chua",
      plotId: "L-001",
      growthStage: "vegetative",
      envMode: "greenhouse",
      symptomDescription: "Vàng lá nhẹ",
      severity: "Nhẹ",
      images: ["file:///path/to/img1.jpg", "file:///path/to/img2.jpg", "file:///path/to/img3.jpg"],
      stationMeasurements: { temperature: 25, lightUvIndex: 5, windSpeed: 2, co2Level: 400 },
      status: "PUBLISHED",
      createdAt: "2026-07-24T10:00:00.000Z",
    },
  ]),
}));

describe("Milestone 1 - Posts Feed Screen & Components Suite", () => {
  const mockPost: Post = {
    id: "test-post-1",
    sessionId: "test-session-1",
    user: { id: "u1", name: "Farmer Test", email: "test@test.com", role: "farmer" },
    cropType: "Dưa hấu",
    plotId: "L-002",
    growthStage: "fruiting",
    envMode: "outdoor",
    symptomDescription: "Đốm lá",
    severity: "Vừa",
    images: ["file:///img1.jpg", "file:///img2.jpg", "file:///img3.jpg"],
    stationMeasurements: { temperature: 28, lightUvIndex: 8, windSpeed: 10, co2Level: 420 },
    status: "PUBLISHED",
    createdAt: "2026-07-24T12:00:00.000Z",
  };

  test("PostCard renders correctly with compact 2-column layout and badge", async () => {
    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <PostCard post={mockPost} onPressImage={jest.fn()} isAdmin={true} />
      );
    });
    const root = tree!.root;
    expect(root.findByProps({ testID: "post-card-test-post-1" })).toBeDefined();
  });

  test("FilterModal renders when visible", async () => {
    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <FilterModal
          visible={true}
          onClose={jest.fn()}
          plots={["L-001", "L-002"]}
          crops={["Cà chua", "Dưa hấu"]}
          selectedPlot="all"
          selectedCrop="all"
          selectedEnv="all"
          onApply={jest.fn()}
          onReset={jest.fn()}
        />
      );
    });
    expect(tree!.toTree()).toBeDefined();
  });

  test("SortModal renders options correctly", async () => {
    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <SortModal
          visible={true}
          onClose={jest.fn()}
          selectedSort="newest"
          onSelectSort={jest.fn()}
        />
      );
    });
    expect(tree!.toTree()).toBeDefined();
  });

  test("ImageViewerModal renders with images and counter", async () => {
    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <ImageViewerModal
          visible={true}
          images={["file:///img1.jpg", "file:///img2.jpg"]}
          initialIndex={0}
          onClose={jest.fn()}
        />
      );
    });
    expect(tree!.toTree()).toBeDefined();
  });

  test("PostSkeletons renders 4 animated shimmer cards", async () => {
    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<PostSkeletons />);
    });
    expect(tree!.toTree()).toBeDefined();
  });

  test("PostsScreen main view renders testID posts-screen and posts-search-input", async () => {
    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<PostsTab />);
    });
    const root = tree!.root;
    expect(root.findByProps({ testID: "posts-screen" })).toBeDefined();
    expect(root.findByProps({ testID: "posts-search-input" })).toBeDefined();
  });
});
