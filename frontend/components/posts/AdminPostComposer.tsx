import {
  CaptureCropOptions,
  CapturePlotOptions,
  CaptureStageOptions,
  CaptureWeatherOptions,
  getCaptureWeatherLabel,
} from "@/components/shared/CaptureFormParts";
import { COLORS } from "@/constants/theme";
import {
  captureCropImage,
  pickCropImagesFromLibrary,
} from "@/services/cameraService";
import { createManualPost } from "@/services/postService";
import {
  CropTypeInfo,
  GrowthStageId,
  PlotInfo,
  SymptomSeverity,
} from "@/types";
import { X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CapturePhotoSection } from "../captures/CapturePhotoSection";
import { CropInfoSection } from "../captures/CropInfoSection";
import { SymptomSection } from "../captures/SymptomSection";
import { BottomSheet } from "../shared/BottomSheet";
import { InputSelection } from "../shared/InputSelection";
import { PrimaryButton } from "../shared/PrimaryButton";

type ComposerSheet = "crop" | "plot" | "stage" | "weather";

export function AdminPostComposer({
  visible,
  crops,
  onClose,
  onSaved,
  plots,
}: {
  visible: boolean;
  crops: CropTypeInfo[];
  onClose: () => void;
  onSaved: () => void;
  plots: PlotInfo[];
}) {
  const [plotId, setPlotId] = useState("");
  const [cropType, setCropType] = useState("");
  const [growthStage, setGrowthStage] = useState<GrowthStageId | undefined>();
  const [images, setImages] = useState<string[]>([]);
  const [weatherCode, setWeatherCode] = useState(0);
  const [severity, setSeverity] = useState<SymptomSeverity | undefined>();
  const [symptomDescription, setSymptomDescription] = useState("");
  const [isEditingSymptom, setIsEditingSymptom] = useState(true);
  const [sheet, setSheet] = useState<ComposerSheet | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const shouldShowSymptomDescription = Boolean(severity);
  const shouldShowInlineErrors = Boolean(error);
  const cleanSymptomDescription = symptomDescription.trim();

  const reset = () => {
    setPlotId("");
    setCropType("");
    setGrowthStage(undefined);
    setImages([]);
    setWeatherCode(0);
    setSeverity(undefined);
    setSymptomDescription("");
    setIsEditingSymptom(true);
    setSheet(null);
    setError("");
  };

  const close = () => {
    if (saving) return;
    setSheet(null);
    onClose();
  };

  const addCapturedPhoto = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 180));
      const uri = await captureCropImage();
      setImages((current) => [...current, uri]);
    } catch (err: any) {
      if (err?.message === "Image capture canceled") return;
      Alert.alert("Không thể chụp ảnh", err?.message || "Vui lòng thử lại.");
    }
  };

  const addDevicePhotos = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 180));
      const pickedImages = await pickCropImagesFromLibrary();
      if (pickedImages.length) {
        setImages((current) => [...current, ...pickedImages]);
      }
    } catch (err: any) {
      Alert.alert("Không thể chọn ảnh", err?.message || "Vui lòng thử lại.");
    }
  };

  const openImageSourceActions = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Hủy", "Chụp ảnh", "Chọn ảnh"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            addCapturedPhoto();
          }
          if (buttonIndex === 2) {
            addDevicePhotos();
          }
        },
      );
      return;
    }

    Alert.alert("Thêm ảnh bài đăng", undefined, [
      { text: "Chụp ảnh", onPress: addCapturedPhoto },
      { text: "Chọn ảnh", onPress: addDevicePhotos },
      { text: "Hủy", style: "cancel" },
    ]);
  };

  const submit = async () => {
    if (
      !images.length ||
      !plotId ||
      !cropType ||
      !growthStage ||
      !severity ||
      !cleanSymptomDescription
    ) {
      setError("Vui lòng nhập đầy đủ thông tin bài đăng.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await createManualPost({
        cropType,
        growthStage,
        images,
        plotId,
        severity,
        symptomDescription: cleanSymptomDescription,
        weatherCode,
      });
      reset();
      Alert.alert("Đã đăng bài", "Bài đăng đã được lưu thành công.");
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Không thể đăng bài.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={postComposerStyles.composerScreen}>
        <View style={postComposerStyles.composerHeader}>
          <View>
            <Text style={postComposerStyles.composerTitle}>Đăng bài</Text>
            <Text style={postComposerStyles.composerSubtitle}>
              Điền thông tin tổng quan cho bài đăng mới
            </Text>
          </View>
          <Pressable style={postComposerStyles.composerClose} onPress={close}>
            <X size={22} color={COLORS.body} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={postComposerStyles.composerContent}
          keyboardShouldPersistTaps="handled"
        >
          <CapturePhotoSection
            actionLabel="Thêm ảnh"
            errorText={
              error && !images.length ? "Vui lòng thêm ảnh bài đăng" : undefined
            }
            helpText="Chụp hoặc chọn ít nhất 1 ảnh"
            images={images}
            onAddPhoto={openImageSourceActions}
            onRemovePhoto={(index) =>
              setImages((current) => current.filter((_, i) => i !== index))
            }
            title="Ảnh bài đăng"
          />

          <View style={postComposerStyles.composerSection}>
            <CropInfoSection
              cropType={cropType}
              cropTypeError={
                error && !cropType ? "Vui lòng chọn loại cây" : undefined
              }
              cropTypePlaceholder="Chọn loại cây"
              growthStage={growthStage}
              growthStageError={
                error && !growthStage ? "Vui lòng chọn giai đoạn" : undefined
              }
              growthStagePlaceholder="Chọn giai đoạn"
              onOpenCrop={() => setSheet("crop")}
              onOpenPlot={() => setSheet("plot")}
              onOpenStage={() => setSheet("stage")}
              plotId={plotId || undefined}
              plotIdError={
                error && !plotId ? "Vui lòng chọn mã số luống" : undefined
              }
              plotIdLabel="Mã số luống"
              plotIdRequired
              title="Thông tin bài đăng"
            />
            <InputSelection
              label="Loại thời tiết"
              required
              value={getCaptureWeatherLabel(weatherCode)}
              placeholder="Chọn loại thời tiết"
              onPress={() => setSheet("weather")}
            />
            <SymptomSection
              isEditingSymptom={isEditingSymptom}
              onEditSymptom={setIsEditingSymptom}
              onSelectSeverity={(value) => {
                setSeverity(value);
                setIsEditingSymptom(true);
              }}
              onSymptomDescriptionChange={setSymptomDescription}
              severity={severity}
              shouldShowInlineErrors={shouldShowInlineErrors}
              shouldShowSymptomDescription={shouldShowSymptomDescription}
              symptomDescription={symptomDescription}
              symptomDescriptionError={
                !severity
                  ? "Vui lòng chọn tình trạng"
                  : !cleanSymptomDescription
                    ? "Vui lòng nhập mô tả triệu chứng"
                    : undefined
              }
            />
          </View>
          {error ? (
            <Text style={postComposerStyles.composerError}>{error}</Text>
          ) : null}
        </ScrollView>

        <View style={postComposerStyles.composerFooter}>
          <PrimaryButton
            label="Lưu bài đăng"
            onPress={submit}
            loading={saving}
            disabled={saving}
            inactive={
              !images.length ||
              !plotId ||
              !cropType ||
              !growthStage ||
              !severity ||
              !cleanSymptomDescription
            }
          />
        </View>

        <BottomSheet
          visible={sheet === "plot"}
          title="Chọn mã số luống"
          onClose={() => setSheet(null)}
        >
          <CapturePlotOptions
            contentPaddingBottom={36}
            plotId={plotId}
            plots={plots}
            onSelect={setPlotId}
          />
        </BottomSheet>

        <BottomSheet
          visible={sheet === "crop"}
          title="Chọn loại cây"
          onClose={() => setSheet(null)}
        >
          <CaptureCropOptions
            contentPaddingBottom={72}
            cropType={cropType}
            crops={crops}
            onSelect={setCropType}
          />
        </BottomSheet>

        <BottomSheet
          visible={sheet === "stage"}
          title="Chọn giai đoạn sinh trưởng"
          onClose={() => setSheet(null)}
        >
          <CaptureStageOptions
            contentPaddingBottom={28}
            growthStage={growthStage}
            onSelect={setGrowthStage}
          />
        </BottomSheet>

        <BottomSheet
          visible={sheet === "weather"}
          title="Chọn loại thời tiết"
          onClose={() => setSheet(null)}
        >
          <CaptureWeatherOptions
            contentPaddingBottom={28}
            weatherCode={weatherCode}
            onSelect={setWeatherCode}
          />
        </BottomSheet>
      </View>
    </Modal>
  );
}

const postComposerStyles = StyleSheet.create({
  composerScreen: {
    flex: 1,
    backgroundColor: "#f8faf9",
  },
  composerHeader: {
    minHeight: 88,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#edf0ea",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  composerTitle: {
    color: "#111827",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  composerSubtitle: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  composerClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  composerContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120,
    gap: 16,
  },
  composerSection: {
    gap: 14,
  },
  composerError: {
    color: "#b42318",
    fontSize: 13,
    lineHeight: 18,
  },
  composerFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#edf0ea",
  },
});
