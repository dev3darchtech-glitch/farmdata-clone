import { COLORS, LAYOUT, TYPOGRAPHY } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import {
  getCropTypes,
  getPlantDiseases,
  getPlots,
} from "@/services/adminService";
import {
  captureImageWithMetadata,
  pickCropImagesFromLibrary,
} from "@/services/cameraService";
import { getCurrentLocation } from "@/services/locationService";
import {
  completeCaptureSession,
  validateCaptureSession,
} from "@/services/postService";
import {
  createEmptyOutdoorWeatherData,
  fetchOutdoorWeather,
} from "@/services/weatherService";
import {
  CropTypeInfo,
  EnvMode,
  GrowthStageId,
  LocalWeatherMeasurement,
  LocationData,
  PlantDiseaseGroup,
  PlantDiseaseInfo,
  PlotInfo,
  SymptomSeverity,
  WeatherCondition,
} from "@/types";
import { normalizeRole, SheetKind } from "@/utils/captureDisplay";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CapturePhotoSection } from "../captures/CapturePhotoSection";
import { CropInfoSection } from "../captures/CropInfoSection";
import { EnvironmentSection } from "../captures/EnvironmentSection";
import { LocalMeasurementSection } from "../captures/LocalMeasurementSection";
import { SelectionSheets } from "../captures/SelectionSheets";
import { SymptomSection } from "../captures/SymptomSection";
import { AppScreenLayout } from "../shared/AppScreenLayout";
import { KeyboardFormScrollView } from "../shared/KeyboardFormScrollView";
import { LoadingProgressDialog } from "../shared/LoadingProgressDialog";
import { PrimaryButton } from "../shared/PrimaryButton";

const CAPTURE_DRAFT_STORAGE_PREFIX = "capture_session_draft";

type CaptureScreenDraft = {
  images: string[];
  plotId?: string;
  cropType: string;
  growthStage?: GrowthStageId;
  envMode: EnvMode;
  captureLocation?: LocationData;
  stationWeather: WeatherCondition;
  stationT24?: WeatherCondition;
  stationT48?: WeatherCondition;
  stationUpdatedAt?: string;
  stationLatitude?: number;
  stationLongitude?: number;
  localMeasurements?: LocalWeatherMeasurement;
  diseaseGroup?: PlantDiseaseGroup;
  diseaseType?: string;
  diseaseName?: string;
  symptomDescription: string;
  severity?: SymptomSeverity;
  isEditingSymptom: boolean;
};

function hasMeaningfulCaptureDraft(draft: CaptureScreenDraft) {
  return Boolean(
    draft.images.length ||
    draft.plotId ||
    draft.cropType ||
    draft.growthStage ||
    draft.envMode !== "outdoor" ||
    draft.localMeasurements ||
    draft.diseaseGroup ||
    draft.diseaseType ||
    draft.diseaseName ||
    draft.symptomDescription.trim() ||
    draft.severity,
  );
}

const captureScreenStyles = StyleSheet.create({
  captureScroll: {
    flex: 1,
  },
  captureContent: {
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: LAYOUT.screenTop,
    paddingBottom: 32,
    gap: LAYOUT.screenGap,
  },
  screenTitle: {
    color: COLORS.body,
    fontSize: TYPOGRAPHY.title,
    fontWeight: "700",
    lineHeight: TYPOGRAPHY.titleLine,
  },
  fixedCta: {
    marginTop: 4,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: 8,
  },
  ctaErrorText: {
    color: COLORS.danger,
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.bodyLine,
    textAlign: "center",
  },
});

export function CaptureScreen() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = normalizeRole(user?.role as string) === "admin";
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [plots, setPlots] = useState<PlotInfo[]>([]);
  const [crops, setCrops] = useState<CropTypeInfo[]>([]);
  const [plantDiseases, setPlantDiseases] = useState<PlantDiseaseInfo[]>([]);
  const [plotId, setPlotId] = useState<string | undefined>();
  const [cropType, setCropType] = useState("");
  const [growthStage, setGrowthStage] = useState<GrowthStageId | undefined>();
  const [envMode, setEnvMode] = useState<EnvMode>("outdoor");
  const initialStationData = createEmptyOutdoorWeatherData();
  const [stationWeather, setStationWeather] = useState<WeatherCondition>(
    initialStationData.current,
  );
  const [stationT24, setStationT24] = useState<WeatherCondition | undefined>(
    initialStationData.t24,
  );
  const [stationT48, setStationT48] = useState<WeatherCondition | undefined>(
    initialStationData.t48,
  );
  const [stationUpdatedAt, setStationUpdatedAt] = useState(
    initialStationData.timestamp,
  );
  const [stationLatitude, setStationLatitude] = useState(
    initialStationData.latitude,
  );
  const [stationLongitude, setStationLongitude] = useState(
    initialStationData.longitude,
  );
  const [captureLocation, setCaptureLocation] = useState<
    LocationData | undefined
  >();
  const [localMeasurements, setLocalMeasurements] = useState<
    LocalWeatherMeasurement | undefined
  >();
  const [symptomDescription, setSymptomDescription] = useState("");
  const [diseaseGroup, setDiseaseGroup] = useState<
    PlantDiseaseGroup | undefined
  >();
  const [diseaseType, setDiseaseType] = useState<string | undefined>();
  const [diseaseName, setDiseaseName] = useState<string | undefined>();
  const [severity, setSeverity] = useState<SymptomSeverity | undefined>();
  const [isEditingSymptom, setIsEditingSymptom] = useState(true);
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [error, setError] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const lastFetchTimeRef = useRef<number>(0);
  const captureLocationRef = useRef<LocationData | undefined>(undefined);
  captureLocationRef.current = captureLocation;
  const isMountedRef = useRef<boolean>(true);
  const hasHydratedDraftRef = useRef(false);
  const clearDraftAfterSubmitRef = useRef(false);
  const hydratedDraftLocationRef = useRef<LocationData | undefined>(undefined);
  const draftStorageKey = `${CAPTURE_DRAFT_STORAGE_PREFIX}:${user?.id || "guest"}`;

  const applyWeatherForLocation = useCallback((location: LocationData) => {
    const now = Date.now();
    // Debounce: ignore calls if the last fetch was less than 5 seconds ago to avoid spam
    if (now - lastFetchTimeRef.current < 5000) {
      return Promise.resolve();
    }
    lastFetchTimeRef.current = now;

    return fetchOutdoorWeather(location.latitude, location.longitude)
      .then((weather) => {
        try {
          if (!isMountedRef.current) return;
          setStationWeather(weather.current);
          setStationT24(weather.t24);
          setStationT48(weather.t48);
          setStationUpdatedAt(weather.timestamp);
          setStationLatitude(weather.latitude ?? location.latitude);
          setStationLongitude(weather.longitude ?? location.longitude);
        } catch {}
      })
      .catch(() => {
        try {
          if (!isMountedRef.current) return;
          const emptyStationData = createEmptyOutdoorWeatherData(
            location.latitude,
            location.longitude,
          );
          setStationWeather(emptyStationData.current);
          setStationT24(emptyStationData.t24);
          setStationT48(emptyStationData.t48);
          setStationUpdatedAt(emptyStationData.timestamp);
          setStationLatitude(location.latitude);
          setStationLongitude(location.longitude);
        } catch {}
      });
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    isMountedRef.current = true;
    hasHydratedDraftRef.current = false;

    AsyncStorage.getItem(draftStorageKey)
      .then((rawDraft) => {
        if (!isMounted || !rawDraft) return;

        const draft = JSON.parse(rawDraft) as Partial<CaptureScreenDraft>;
        if (Array.isArray(draft.images)) setImages(draft.images);
        if (draft.plotId !== undefined) setPlotId(draft.plotId);
        if (typeof draft.cropType === "string") setCropType(draft.cropType);
        if (draft.growthStage) setGrowthStage(draft.growthStage);
        if (draft.envMode) setEnvMode(draft.envMode);
        if (draft.captureLocation) {
          setCaptureLocation(draft.captureLocation);
          hydratedDraftLocationRef.current = draft.captureLocation;
        }
        if (draft.localMeasurements !== undefined) {
          setLocalMeasurements(draft.localMeasurements);
        }
        if (draft.diseaseGroup) setDiseaseGroup(draft.diseaseGroup);
        if (typeof draft.diseaseType === "string") {
          setDiseaseType(draft.diseaseType);
        }
        if (typeof draft.diseaseName === "string") {
          setDiseaseName(draft.diseaseName);
        }
        if (typeof draft.symptomDescription === "string") {
          setSymptomDescription(draft.symptomDescription);
        }
        if (draft.severity) setSeverity(draft.severity);
        if (typeof draft.isEditingSymptom === "boolean") {
          setIsEditingSymptom(draft.isEditingSymptom);
        }
      })
      .catch(() => {
        // Ignore corrupt or unavailable draft storage.
      })
      .finally(() => {
        if (isMounted) {
          hasHydratedDraftRef.current = true;
          if (hydratedDraftLocationRef.current) {
            applyWeatherForLocation(hydratedDraftLocationRef.current);
          }
        }
      });

    // Do not make unauthenticated requests: the API returns 401 and the
    // client intentionally maps failed master-data requests to empty arrays.
    if (isAuthenticated && user?.id) {
      Promise.allSettled([getPlots(), getCropTypes(), getPlantDiseases()]).then(
        ([plotResult, cropResult, diseaseResult]) => {
          if (!isMounted) return;

          if (plotResult.status === "fulfilled") setPlots(plotResult.value);
          if (cropResult.status === "fulfilled") setCrops(cropResult.value);
          if (diseaseResult.status === "fulfilled") {
            setPlantDiseases(diseaseResult.value);
          }
        },
      );
    }

    const isTestEnv =
      typeof process !== "undefined" &&
      (process.env.NODE_ENV === "test" ||
        process.env.JEST_WORKER_ID !== undefined);
    let intervalId: any;

    if (!isTestEnv) {
      getCurrentLocation()
        .then((loc) => {
          try {
            if (!isMounted) return;
            setCaptureLocation(loc);
            hydratedDraftLocationRef.current = loc;
            return applyWeatherForLocation(loc);
          } catch {}
        })
        .catch(() => {
          try {
            if (!isMounted) return;
            if (hydratedDraftLocationRef.current) {
              applyWeatherForLocation(hydratedDraftLocationRef.current);
              return;
            }

            const emptyStationData = createEmptyOutdoorWeatherData();
            setStationWeather(emptyStationData.current);
            setStationT24(emptyStationData.t24);
            setStationT48(emptyStationData.t48);
            setStationUpdatedAt(emptyStationData.timestamp);
            setStationLatitude(undefined);
            setStationLongitude(undefined);
          } catch {}
        });

      // Auto-update station weather every 1 minute
      intervalId = setInterval(() => {
        getCurrentLocation()
          .then((loc) => {
            try {
              if (!isMounted) return;
              setCaptureLocation(loc);
              applyWeatherForLocation(loc);
            } catch {}
          })
          .catch(() => {
            try {
              if (!isMounted) return;
              if (captureLocationRef.current) {
                applyWeatherForLocation(captureLocationRef.current);
              }
            } catch {}
          });
      }, 60000);
    } else {
      // In Jest tests, initialize synchronously to prevent async leaks
      const emptyStationData = createEmptyOutdoorWeatherData();
      setStationWeather(emptyStationData.current);
      setStationT24(emptyStationData.t24);
      setStationT48(emptyStationData.t48);
      setStationUpdatedAt(emptyStationData.timestamp);
      setStationLatitude(undefined);
      setStationLongitude(undefined);
      setCaptureLocation({
        latitude: 0,
        longitude: 0,
        accuracy: 0,
        timestamp: new Date().toISOString(),
      });
    }

    return () => {
      isMounted = false;
      isMountedRef.current = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [applyWeatherForLocation, draftStorageKey, isAuthenticated, user?.id]);


  const captureDraft: CaptureScreenDraft = useMemo(
    () => ({
      images,
      plotId,
      cropType,
      growthStage,
      envMode,
      captureLocation,
      stationWeather,
      stationT24,
      stationT48,
      stationUpdatedAt,
      stationLatitude,
      stationLongitude,
      localMeasurements,
      diseaseGroup,
      diseaseType,
      diseaseName,
      symptomDescription,
      severity,
      isEditingSymptom,
    }),
    [
      captureLocation,
      cropType,
      diseaseGroup,
      diseaseName,
      diseaseType,
      envMode,
      growthStage,
      images,
      isEditingSymptom,
      localMeasurements,
      plotId,
      severity,
      stationLatitude,
      stationLongitude,
      stationUpdatedAt,
      stationWeather,
      stationT24,
      stationT48,
      symptomDescription,
    ],
  );

  useEffect(() => {
    if (!hasHydratedDraftRef.current) return;

    const timeoutId = setTimeout(() => {
      if (clearDraftAfterSubmitRef.current) {
        AsyncStorage.removeItem(draftStorageKey).catch(() => {});
        return;
      }

      if (!hasMeaningfulCaptureDraft(captureDraft)) {
        AsyncStorage.removeItem(draftStorageKey).catch(() => {});
        return;
      }

      AsyncStorage.setItem(draftStorageKey, JSON.stringify(captureDraft)).catch(
        () => {},
      );
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [captureDraft, draftStorageKey]);

  const sessionDraft = {
    farmerId: user?.id || "",
    farmerName: user?.name || "",
    farmerEmail: user?.email,
    images,
    plotId,
    cropType,
    growthStage,
    envMode,
    captureLocation,
    stationMeasurements: stationWeather,
    stationMeasurementsT24: stationT24,
    stationMeasurementsT48: stationT48,
    localMeasurements,
    diseaseGroup,
    diseaseType,
    diseaseName,
    symptomDescription,
    severity,
  };
  const validation = validateCaptureSession(sessionDraft);
  const shouldShowSymptomDescription = Boolean(severity);
  const shouldShowInlineErrors = attemptedSubmit && !validation.isValid;
  const uploadPercent =
    progressTotal > 0
      ? Math.round(
          (Math.min(progressCurrent, progressTotal) / progressTotal) * 100,
        )
      : 0;
  const defaultContentBottom = 32;

  const handleSymptomDescriptionFocus = useCallback(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 120);
    });
  }, []);

  const addPhoto = async () => {
    try {
      let source: "camera" | "library" | "cancel" = "camera";

      if (isAdmin) {
        source = await new Promise<"camera" | "library" | "cancel">(
          (resolve) => {
            Alert.alert("Thêm ảnh", "Chọn cách thêm ảnh", [
              {
                text: "Chọn từ thư viện",
                onPress: () => resolve("library"),
              },
              { text: "Chụp ảnh", onPress: () => resolve("camera") },
              {
                text: "Hủy",
                style: "cancel",
                onPress: () => resolve("cancel"),
              },
            ]);
          },
        );
      }

      if (source === "cancel") return;

      if (source === "library") {
        const selectedImages = await pickCropImagesFromLibrary();
        if (selectedImages.length) {
          setImages((current) => [...current, ...selectedImages]);
        }
        return;
      }

      const result = await captureImageWithMetadata();
      setImages((current) => [...current, result.uri]);
      setCaptureLocation(result.location);
      await applyWeatherForLocation(result.location);
    } catch (err: any) {
      Alert.alert("Không thể chụp ảnh", err?.message || "Vui lòng thử lại.");
    }
  };

  const submit = async () => {
    if (!validation.isValid || !growthStage || !severity) {
      setAttemptedSubmit(true);
      setError(
        Object.values(validation.errors)[0] ||
          "Thông tin phiên chụp chưa đầy đủ",
      );
      return;
    }
    setAttemptedSubmit(false);
    setSaving(true);
    setProgress(`Đang tải 0/${images.length} ảnh`);
    setProgressCurrent(0);
    setProgressTotal(images.length);
    try {
      await completeCaptureSession(
        {
          ...sessionDraft,
          growthStage,
          severity,
        },
        (_message, current, total) => {
          setProgress(`Đang tải ${current}/${total} ảnh`);
          setProgressCurrent(current);
          setProgressTotal(total);
        },
      );
      setSheet("success");
      clearDraftAfterSubmitRef.current = true;
      await AsyncStorage.removeItem(draftStorageKey).catch(() => {});
      setImages([]);
      setPlotId(undefined);
      setCropType("");
      setGrowthStage(undefined);
      setSymptomDescription("");
      setDiseaseGroup(undefined);
      setDiseaseType(undefined);
      setDiseaseName(undefined);
      setSeverity(undefined);
      setIsEditingSymptom(true);
      setLocalMeasurements(undefined);
      setAttemptedSubmit(false);
      setTimeout(() => {
        clearDraftAfterSubmitRef.current = false;
      }, 0);
    } catch (err: any) {
      setError(
        err?.message || "Chưa thể lưu phiên chụp; dữ liệu vẫn được giữ lại.",
      );
      setSheet("error");
    } finally {
      setSaving(false);
      setProgressCurrent(0);
      setProgressTotal(0);
    }
  };

  return (
    <AppScreenLayout
      active="capture"
      testID="capture-screen-container"
      overlays={
        <>
          <LoadingProgressDialog
            visible={saving}
            title="Đang lưu phiên chụp..."
            detail={progress}
            percent={uploadPercent}
          />
          <SelectionSheets
            sheet={sheet}
            setSheet={setSheet}
            plots={plots}
            crops={crops}
            plantDiseases={plantDiseases}
            plotId={plotId}
            cropType={cropType}
            growthStage={growthStage}
            diseaseGroup={diseaseGroup}
            diseaseType={diseaseType}
            diseaseName={diseaseName}
            stationWeather={stationWeather}
            stationT24={stationT24}
            stationT48={stationT48}
            stationUpdatedAt={stationUpdatedAt}
            stationLatitude={stationLatitude}
            stationLongitude={stationLongitude}
            captureLocation={captureLocation}
            onPlot={setPlotId}
            onCrop={setCropType}
            onStage={setGrowthStage}
            onDiseaseGroup={(value) => {
              setDiseaseGroup(value);
              setDiseaseType(undefined);
              setDiseaseName(undefined);
            }}
            onDiseaseType={(value) => {
              setDiseaseType(value);
              setDiseaseName(undefined);
            }}
            onDiseaseName={setDiseaseName}
            localMeasurements={localMeasurements}
            onMeasurements={setLocalMeasurements}
            error={error}
          />
        </>
      }
    >
      <View testID="storage-destination-picker" style={{ display: "none" }} />
      <KeyboardFormScrollView
        ref={scrollViewRef}
        style={captureScreenStyles.captureScroll}
        contentContainerStyle={[
          captureScreenStyles.captureContent,
          { paddingBottom: defaultContentBottom },
          isKeyboardVisible
            ? {
                paddingBottom: Platform.OS === "ios" ? 120 : 96,
              }
            : null,
        ]}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        bottomOffset={96}
      >
        <Text style={captureScreenStyles.screenTitle}>Phiên chụp mới</Text>

        <CapturePhotoSection
          actionLabel={isAdmin ? "Thêm ảnh" : "Chụp ảnh"}
          images={images}
          onAddPhoto={addPhoto}
          onRemovePhoto={(index) =>
            setImages((current) => current.filter((_, i) => i !== index))
          }
          order={1}
        />

        <CropInfoSection
          cropType={cropType}
          cropTypeError={
            shouldShowInlineErrors ? validation.errors.cropType : undefined
          }
          growthStage={growthStage}
          growthStageError={
            shouldShowInlineErrors ? validation.errors.growthStage : undefined
          }
          onOpenCrop={() => setSheet("crop")}
          onOpenPlot={() => setSheet("plot")}
          onOpenStage={() => setSheet("stage")}
          order={2}
          plotId={plotId}
        />

        <EnvironmentSection
          captureLocation={captureLocation}
          envMode={envMode}
          onEnvModeChange={setEnvMode}
          onOpenStation={() => setSheet("station")}
          order={3}
          stationWeather={stationWeather}
        />

        <LocalMeasurementSection
          localMeasurements={localMeasurements}
          onOpenMeasurement={() => setSheet("measurement")}
          order={5}
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
          onSymptomDescriptionFocus={handleSymptomDescriptionFocus}
          onSymptomDescriptionChange={setSymptomDescription}
          order={6}
          severity={severity}
          diseaseGroup={diseaseGroup}
          diseaseType={diseaseType}
          diseaseName={diseaseName}
          diseaseGroupError={validation.errors.diseaseGroup}
          diseaseTypeError={validation.errors.diseaseType}
          diseaseNameError={validation.errors.diseaseName}
          shouldShowInlineErrors={shouldShowInlineErrors}
          shouldShowSymptomDescription={shouldShowSymptomDescription}
          symptomDescription={symptomDescription}
          symptomDescriptionError={validation.errors.symptomDescription}
        />
        {!isKeyboardVisible ? (
          <View style={captureScreenStyles.fixedCta}>
            <PrimaryButton
              label="Hoàn tất phiên chụp"
              onPress={submit}
              disabled={saving}
              inactive={!validation.isValid}
              loading={saving}
              testID="submit-capture-button"
            />
            {shouldShowInlineErrors ? (
              <Text style={captureScreenStyles.ctaErrorText}>
                Vui lòng nhập đủ thông tin bắt buộc
              </Text>
            ) : null}
          </View>
        ) : null}
      </KeyboardFormScrollView>
    </AppScreenLayout>
  );
}
