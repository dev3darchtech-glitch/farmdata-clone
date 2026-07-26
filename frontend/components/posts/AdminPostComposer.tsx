import {
  CaptureCropOptions,
  CapturePlotOptions,
  CaptureStageOptions,
  CaptureWeatherOptions,
  getCaptureWeatherLabel,
} from "@/components/shared/CaptureFormParts";
import { COLORS, LAYOUT } from "@/constants/theme";
import {
  captureCropImage,
  pickCropImagesFromLibrary,
} from "@/services/cameraService";
import { getPlantDiseases } from "@/services/adminService";
import { createManualPost } from "@/services/postService";
import {
  CropTypeInfo,
  GrowthStageId,
  PlantDiseaseGroup,
  PlantDiseaseInfo,
  PLANT_DISEASE_GROUPS,
  PlotInfo,
  SymptomSeverity,
} from "@/types";
import { CircleCheck, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
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

type ComposerSheet =
  | "crop"
  | "plot"
  | "stage"
  | "weather"
  | "diseaseGroup"
  | "diseaseType"
  | "diseaseName";

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
  const [plantDiseases, setPlantDiseases] = useState<PlantDiseaseInfo[]>([]);
  const [diseaseGroup, setDiseaseGroup] = useState<
    PlantDiseaseGroup | undefined
  >();
  const [diseaseType, setDiseaseType] = useState<string | undefined>();
  const [diseaseName, setDiseaseName] = useState<string | undefined>();
  const [severity, setSeverity] = useState<SymptomSeverity | undefined>();
  const [symptomDescription, setSymptomDescription] = useState("");
  const [isEditingSymptom, setIsEditingSymptom] = useState(true);
  const [sheet, setSheet] = useState<ComposerSheet | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const shouldShowSymptomDescription = Boolean(severity);
  const shouldShowInlineErrors = Boolean(error);
  const cleanSymptomDescription = symptomDescription.trim();
  const activePlantDiseases = plantDiseases.filter(
    (disease) => disease.isActive !== false,
  );
  const diseaseGroupOptions = Array.from(
    new Set([
      ...PLANT_DISEASE_GROUPS,
      ...activePlantDiseases.map((disease) => disease.group),
    ]),
  );
  const diseaseTypeOptions = Array.from(
    new Set(
      activePlantDiseases
        .filter((disease) => disease.group === diseaseGroup)
        .map((disease) => disease.type),
    ),
  );
  const diseaseNameOptions = activePlantDiseases.filter(
    (disease) => disease.group === diseaseGroup && disease.type === diseaseType,
  );

  useEffect(() => {
    if (!visible) return;
    getPlantDiseases()
      .then(setPlantDiseases)
      .catch(() => setPlantDiseases([]));
  }, [visible]);

  const reset = () => {
    setPlotId("");
    setCropType("");
    setGrowthStage(undefined);
    setImages([]);
    setWeatherCode(0);
    setDiseaseGroup(undefined);
    setDiseaseType(undefined);
    setDiseaseName(undefined);
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
      !diseaseGroup ||
      !diseaseType ||
      !diseaseName ||
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
        diseaseGroup,
        diseaseType,
        diseaseName,
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
              onOpenDiseaseGroup={() => setSheet("diseaseGroup")}
              onOpenDiseaseType={() => {
                if (diseaseGroup) setSheet("diseaseType");
              }}
              onOpenDiseaseName={() => {
                if (diseaseGroup && diseaseType) setSheet("diseaseName");
              }}
              onSymptomDescriptionChange={setSymptomDescription}
              severity={severity}
              diseaseGroup={diseaseGroup}
              diseaseType={diseaseType}
              diseaseName={diseaseName}
              diseaseGroupError={
                !diseaseGroup ? "Vui lòng chọn nhóm bệnh cây" : undefined
              }
              diseaseTypeError={
                !diseaseType ? "Vui lòng chọn loại bệnh cây" : undefined
              }
              diseaseNameError={
                !diseaseName ? "Vui lòng chọn tên bệnh cây" : undefined
              }
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
              !diseaseGroup ||
              !diseaseType ||
              !diseaseName ||
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

        <BottomSheet
          visible={sheet === "diseaseGroup"}
          title="Chọn nhóm bệnh cây"
          onClose={() => setSheet(null)}
        >
          <ComposerDiseaseOptions
            emptyText="Chưa có nhóm bệnh cây"
            options={diseaseGroupOptions.map((group) => ({
              key: group,
              label: group,
              value: group,
            }))}
            selectedValue={diseaseGroup}
            onSelect={(value) => {
              setDiseaseGroup(value as PlantDiseaseGroup);
              setDiseaseType(undefined);
              setDiseaseName(undefined);
              setSheet(null);
            }}
          />
        </BottomSheet>

        <BottomSheet
          visible={sheet === "diseaseType"}
          title="Chọn loại bệnh cây"
          onClose={() => setSheet(null)}
        >
          <ComposerDiseaseOptions
            emptyText="Chọn nhóm bệnh cây trước"
            options={diseaseTypeOptions.map((type) => ({
              key: type,
              label: type,
              value: type,
            }))}
            selectedValue={diseaseType}
            onSelect={(value) => {
              setDiseaseType(value);
              setDiseaseName(undefined);
              setSheet(null);
            }}
          />
        </BottomSheet>

        <BottomSheet
          visible={sheet === "diseaseName"}
          title="Chọn tên bệnh cây"
          onClose={() => setSheet(null)}
        >
          <ComposerDiseaseOptions
            emptyText="Chọn loại bệnh cây trước"
            options={diseaseNameOptions.map((disease) => ({
              key: disease.id || `${disease.type}-${disease.name}`,
              label: disease.name,
              value: disease.name,
              description: disease.type,
            }))}
            selectedValue={diseaseName}
            onSelect={(value) => {
              setDiseaseName(value);
              setSheet(null);
            }}
          />
        </BottomSheet>
      </View>
    </Modal>
  );
}

function ComposerDiseaseOptions({
  emptyText,
  onSelect,
  options,
  selectedValue,
}: {
  emptyText: string;
  onSelect: (value: string) => void;
  options: {
    key: string;
    label: string;
    value: string;
    description?: string;
  }[];
  selectedValue?: string;
}) {
  return (
    <ScrollView
      contentContainerStyle={postComposerStyles.diseaseListContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {options.length > 0 ? (
        options.map((option) => {
          const selected = selectedValue === option.value;
          return (
            <Pressable
              key={option.key}
              style={[
                postComposerStyles.diseaseOption,
                selected && postComposerStyles.diseaseOptionSelected,
              ]}
              onPress={() => onSelect(option.value)}
            >
              <View style={postComposerStyles.diseaseOptionBody}>
                <Text
                  style={[
                    postComposerStyles.diseaseOptionText,
                    selected && postComposerStyles.diseaseOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {option.description ? (
                  <Text style={postComposerStyles.diseaseOptionMeta}>
                    {option.description}
                  </Text>
                ) : null}
              </View>
              {selected ? <CircleCheck size={20} color={COLORS.green} /> : null}
            </Pressable>
          );
        })
      ) : (
        <View style={postComposerStyles.diseaseEmpty}>
          <Text style={postComposerStyles.diseaseEmptyText}>{emptyText}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const postComposerStyles = StyleSheet.create({
  composerScreen: {
    flex: 1,
    backgroundColor: "#f8faf9",
  },
  composerHeader: {
    minHeight: 88,
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: LAYOUT.screenTop,
    paddingBottom: LAYOUT.sectionGap,
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
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: LAYOUT.screenTop,
    paddingBottom: 120,
    gap: LAYOUT.sectionGap,
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
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: 12,
    paddingBottom: LAYOUT.screenTop,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#edf0ea",
  },
  diseaseListContent: {
    paddingBottom: LAYOUT.sheetBottom,
    gap: 8,
  },
  diseaseOption: {
    minHeight: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
  },
  diseaseOptionSelected: {
    borderColor: COLORS.green,
    backgroundColor: "#f0f8ed",
  },
  diseaseOptionBody: {
    flex: 1,
    minWidth: 0,
  },
  diseaseOptionText: {
    color: COLORS.body,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
  },
  diseaseOptionTextSelected: {
    color: COLORS.green,
  },
  diseaseOptionMeta: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  diseaseEmpty: {
    minHeight: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  diseaseEmptyText: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
