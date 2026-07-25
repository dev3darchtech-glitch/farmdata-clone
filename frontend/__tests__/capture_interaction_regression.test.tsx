import CaptureTab from "@/app/(tabs)/capture";
import React from "react";
import { Modal, Text, TextInput } from "react-native";
import renderer, { act } from "react-test-renderer";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: "farmer-test",
      name: "Nông dân kiểm thử",
      email: "farmer@example.com",
      role: "farmer",
    },
    logout: jest.fn(),
  }),
}));

jest.mock("@/services/adminService", () => ({
  getPlots: jest.fn().mockResolvedValue([]),
  getCropTypes: jest.fn().mockResolvedValue([]),
  getUsers: jest.fn().mockResolvedValue([]),
  addPlot: jest.fn(),
  addCropType: jest.fn(),
  importCSV: jest.fn(),
}));

jest.mock("@/services/locationService", () => ({
  getCurrentLocation: jest.fn(),
}));

jest.mock("@/services/weatherService", () => {
  const actual = jest.requireActual("@/services/weatherService");
  return {
    ...actual,
    fetchOutdoorWeather: jest.fn(),
  };
});

jest.mock("@/services/cameraService", () => ({
  captureImageWithMetadata: jest.fn(),
}));

jest.mock("@/services/postService", () => {
  const actual = jest.requireActual("@/services/postService");
  return {
    ...actual,
    completeCaptureSessionAndAutoPost: jest.fn(),
    getPosts: jest.fn().mockResolvedValue([]),
  };
});

function findPressableContainingText(
  root: renderer.ReactTestInstance,
  expectedText: string,
) {
  const matches = root.findAll((node) => {
    if (typeof node.props?.onPress !== "function") return false;
    return node.findAll(
      (child) =>
        child.type === Text &&
        (child.props.children === expectedText ||
          (Array.isArray(child.props.children) &&
            child.props.children.join("") === expectedText)),
    ).length > 0;
  });

  if (!matches.length) {
    throw new Error(`Không tìm thấy nút chứa nội dung: ${expectedText}`);
  }

  return matches[matches.length - 1];
}

function visibleModalCount(root: renderer.ReactTestInstance) {
  return root.findAllByType(Modal).filter((modal) => modal.props.visible).length;
}

describe("Capture interaction regressions", () => {
  it("keeps select drawers open after choosing an option and closes plot drawer for Không chọn mã", async () => {
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(<CaptureTab />);
    });

    const root = tree!.root;

    act(() => {
      root.findByProps({ testID: "plot-id-input" }).props.onPress();
    });
    expect(visibleModalCount(root)).toBe(1);

    act(() => {
      root.findByProps({ testID: "plot-option-L-001" }).props.onPress();
    });
    expect(visibleModalCount(root)).toBe(1);

    act(() => {
      root.findByProps({ testID: "plot-clear-selection" }).props.onPress();
    });
    expect(visibleModalCount(root)).toBe(0);

    act(() => {
      root.findByProps({ testID: "crop-type-input" }).props.onPress();
    });
    expect(visibleModalCount(root)).toBe(1);

    act(() => {
      root.findByProps({ testID: "crop-option-crop-1" }).props.onPress();
    });
    expect(visibleModalCount(root)).toBe(1);

    act(() => {
      root.findAllByType(Modal).find((modal) => modal.props.visible)!.props.onRequestClose();
    });
    expect(visibleModalCount(root)).toBe(0);

    act(() => {
      root.findByProps({ testID: "growth-stage-input" }).props.onPress();
    });
    expect(visibleModalCount(root)).toBe(1);

    act(() => {
      root.findByProps({ testID: "stage-option-flowering" }).props.onPress();
    });
    expect(visibleModalCount(root)).toBe(1);

    act(() => {
      tree!.unmount();
    });
  });

  it("accepts more than one symptom character and stays editable after changing severity", async () => {
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(<CaptureTab />);
    });

    const root = tree!.root;

    act(() => {
      findPressableContainingText(root, "Nhẹ (>10 - 25%)").props.onPress();
    });

    let input = root.findByProps({ testID: "symptom-description-input" });
    expect(input.type).toBe(TextInput);

    act(() => {
      input.props.onChangeText("V");
    });
    input = root.findByProps({ testID: "symptom-description-input" });
    expect(input.props.value).toBe("V");

    act(() => {
      input.props.onChangeText("Vàng lá xuất hiện ở mép lá");
    });
    input = root.findByProps({ testID: "symptom-description-input" });
    expect(input.props.value).toBe("Vàng lá xuất hiện ở mép lá");

    act(() => {
      input.props.onBlur();
    });
    expect(
      root.findAllByProps({ testID: "symptom-description-input" }),
    ).toHaveLength(0);

    act(() => {
      findPressableContainingText(root, "Nhẹ (>10 - 25%)").props.onPress();
    });
    input = root.findByProps({ testID: "symptom-description-input" });
    expect(input.props.value).toBe("Vàng lá xuất hiện ở mép lá");

    act(() => {
      findPressableContainingText(root, "Vừa (>25 - 50%)").props.onPress();
    });
    input = root.findByProps({ testID: "symptom-description-input" });

    act(() => {
      input.props.onChangeText("Đốm nâu lan rộng sau khi đổi mức độ");
    });
    input = root.findByProps({ testID: "symptom-description-input" });
    expect(input.props.value).toBe("Đốm nâu lan rộng sau khi đổi mức độ");

    act(() => {
      tree!.unmount();
    });
  });
});
