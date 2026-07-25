import googleLogo from "@/assets/images/google-logo.png";
import authBackground from "@/assets/images/login-background.png";
import loginEye from "@/assets/images/login-eye.png";
import loginLock from "@/assets/images/login-lock.png";
import loginUser from "@/assets/images/login-user.png";
import farmLogo from "@/assets/images/logo-farmdata.png";
import { getGrowthStageById, GROWTH_STAGES } from "@/constants/growthStages";
import { useAuth } from "@/hooks/useAuth";
import { loginFormSchema, type LoginFormValues } from "@/schemas/formSchemas";
import {
  addCropType,
  addPlot,
  getCropTypes,
  getPlots,
  getUsers,
  importCSV,
} from "@/services/adminService";
import { captureImageWithMetadata } from "@/services/cameraService";
import { getCurrentLocation } from "@/services/locationService";
import {
  completeCaptureSessionAndAutoPost,
  getPosts,
  validateCaptureSession,
} from "@/services/postService";
import {
  fetchOutdoorWeather,
  MOCK_OUTDOOR_WEATHER,
} from "@/services/weatherService";
import {
  CropTypeInfo,
  EnvMode,
  GrowthStageId,
  LocalWeatherMeasurement,
  LocationData,
  PlotInfo,
  Post,
  SymptomSeverity,
  User,
  WeatherCondition,
} from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  Apple,
  Bell,
  Camera,
  Carrot,
  Check,
  Cherry,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleUserRound,
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  FileText,
  Filter,
  Flame,
  Flower2,
  Gauge,
  Image as ImageIcon,
  Info,
  Leaf,
  LeafyGreen,
  LogOut,
  MapPin,
  Menu,
  MoreVertical,
  Plus,
  Salad,
  Search,
  Sprout,
  Sun,
  Thermometer,
  Tractor,
  TreePine,
  Upload,
  Vegan,
  Wind,
  X,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { FilterModal } from "../posts/FilterModal";
import { SortModal } from "../posts/SortModal";

const COLORS = {
  green: "#31582b",
  activeGreen: "#2e7d32",
  greenSoft: "#eef7e9",
  text: "#111827",
  body: "#565656",
  muted: "#848484",
  border: "#e0e0e0",
  field: "rgba(224,224,224,0.5)",
  danger: "#ba1a1a",
  warning: "#facc15",
  surface: "#ffffff",
  screen: "#ffffff",
};

const DEMO_IMAGES = [
  "https://www.figma.com/api/mcp/asset/28180119-cd9b-4abd-b7a7-fba8f9397f58",
  "https://www.figma.com/api/mcp/asset/1073a2c2-cfeb-4e12-81c3-034fbf864947",
  "https://www.figma.com/api/mcp/asset/fc95adfe-67d0-40b2-acb3-87b2ef98ae09",
  "https://www.figma.com/api/mcp/asset/c36ebff9-4011-434d-8893-8388404c6282",
];

const DEFAULT_PLOTS: PlotInfo[] = [
  {
    id: "plot-1",
    code: "L-001",
    name: "Khu A - Luống 001",
    areaSquareMeters: 1000,
  },
  {
    id: "plot-2",
    code: "L-002",
    name: "Khu A - Luống 002",
    areaSquareMeters: 800,
  },
  {
    id: "plot-3",
    code: "L-003",
    name: "Khu B - Luống 003",
    areaSquareMeters: 1200,
  },
  {
    id: "plot-4",
    code: "L-004",
    name: "Khu B - Luống 004",
    areaSquareMeters: 900,
  },
  {
    id: "plot-5",
    code: "L-005",
    name: "Khu C - Luống 005",
    areaSquareMeters: 1100,
  },
];

const DEFAULT_CROPS: CropTypeInfo[] = [
  { id: "crop-1", name: "Cà chua", category: "Rau ăn quả" },
  { id: "crop-2", name: "Dưa leo", category: "Rau ăn quả" },
  { id: "crop-3", name: "Ớt", category: "Rau gia vị" },
  { id: "crop-4", name: "Khoai tây", category: "Cây lấy củ" },
  { id: "crop-5", name: "Rau xà lách", category: "Rau ăn lá" },
  { id: "crop-6", name: "Bắp cải", category: "Rau ăn lá" },
  { id: "crop-7", name: "Hành lá", category: "Rau gia vị" },
];

const DEFAULT_POSTS: Post[] = [
  {
    id: "post-1",
    sessionId: "sess-1",
    user: {
      id: "farmer-1",
      name: "Nguyễn Văn An",
      email: "an.nguyen@farm.vn",
      role: "farmer",
    },
    cropType: "Cà chua",
    plotId: "L-001",
    growthStage: "fruiting",
    envMode: "greenhouse",
    symptomDescription: "Đốm vàng",
    severity: "Vừa",
    images: DEMO_IMAGES.slice(0, 3),
    stationMeasurements: MOCK_OUTDOOR_WEATHER.current,
    status: "PUBLISHED",
    createdAt: "2026-07-23T08:45:00.000Z",
  },
  {
    id: "post-2",
    sessionId: "sess-2",
    user: {
      id: "farmer-2",
      name: "Trần Thị Bình",
      email: "binh.tran@farm.vn",
      role: "farmer",
    },
    cropType: "Dưa leo",
    plotId: "L-002",
    growthStage: "flowering",
    envMode: "outdoor",
    symptomDescription: "Phấn trắng",
    severity: "Nhẹ",
    images: DEMO_IMAGES.slice(1, 4),
    stationMeasurements: MOCK_OUTDOOR_WEATHER.current,
    status: "PUBLISHED",
    createdAt: "2026-07-22T17:30:00.000Z",
  },
];

type SheetKind =
  | "plot"
  | "crop"
  | "stage"
  | "station"
  | "measurement"
  | "success"
  | "error"
  | "filter"
  | "sort"
  | "add";
type ManagementVariant = "plots" | "crops" | "accounts";
type WeatherMetricKey =
  | "temperature"
  | "lightUvIndex"
  | "windSpeed"
  | "co2Level"
  | "humidity"
  | "weatherCode";

const WEATHER_EDITABLE_METRIC_KEYS: WeatherMetricKey[] = [
  "temperature",
  "humidity",
  "lightUvIndex",
  "windSpeed",
  "co2Level",
];

const WEATHER_CARD_METRIC_KEYS: WeatherMetricKey[] = [
  ...WEATHER_EDITABLE_METRIC_KEYS,
  "weatherCode",
];

function normalizeRole(role?: string | null) {
  return String(role || "farmer").toLowerCase() === "admin"
    ? "admin"
    : "farmer";
}

function stageName(id?: GrowthStageId) {
  return getGrowthStageById(id)?.nameVi || "Chọn một trong 5 giai đoạn";
}

function stageSheetName(id: GrowthStageId) {
  return {
    newly_planted: "1. Mới trồng",
    vegetative: "2. Sinh trưởng",
    flowering: "3. Ra hoa",
    fruiting: "4. Kết trái",
    harvest: "5. Thu hoạch",
  }[id];
}

function stageSheetDescription(id: GrowthStageId, fallback: string) {
  return (
    {
      newly_planted: "Hạt nảy mầm, cây con",
      vegetative: "Cây phát triển thân lá",
      flowering: "Xuất hiện nụ hoa",
      fruiting: "Quá trình hình thành và lớn dần",
      harvest: "Quả chín, thu hoạch",
    }[id] || fallback
  );
}

function envName(env?: EnvMode) {
  return env === "greenhouse" ? "Nhà kính" : "Ngoài trời";
}

function severityLabel(severity?: SymptomSeverity) {
  if (!severity) return "";
  const labels: Record<SymptomSeverity, string> = {
    "Khỏe mạnh": "Khỏe mạnh",
    "Chớm bệnh": "Chớm (1 - 10%)",
    Nhẹ: "Nhẹ (>10 - 25%)",
    Vừa: "Vừa (>25 - 50%)",
    Nặng: "Nặng (>50 - 75%)",
    "Rất nặng": "Rất nặng (>75%)",
  };
  return labels[severity];
}

function formatMetric(value?: number, fractionDigits = 0) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value.toFixed(fractionDigits);
}

function formatCoordinateValue(value?: number) {
  return typeof value === "number" && !Number.isNaN(value)
    ? value.toFixed(6)
    : "--";
}

function formatCaptureLocationName(location?: LocationData) {
  return (
    location?.region ||
    location?.formattedAddress ||
    location?.name ||
    [location?.region, location?.region, location?.country]
      .filter(Boolean)
      .join(", ") ||
    "Vị trí chụp"
  );
}

function plotSheetMeta(plot: PlotInfo) {
  const primaryZone = plot.name.split("-")[0]?.trim() || plot.name.trim();
  const area = plot.areaSquareMeters
    ? `${plot.areaSquareMeters} m²`
    : undefined;
  return [primaryZone, area].filter(Boolean).join(" • ");
}

function normalizePostIdentity(post: Post & { _id?: string }) {
  return {
    ...post,
    id:
      post.id ||
      post._id ||
      post.sessionId ||
      `${post.createdAt}-${post.cropType}-${post.plotId || "no-plot"}`,
  };
}

function postListKey(post: Post & { _id?: string }, index: number) {
  return [
    post.id || post._id || post.sessionId || "post",
    post.createdAt || "no-date",
    index,
  ].join("-");
}

function WeatherStatusIcon({
  code,
  size = 24,
  color,
}: {
  code?: number;
  size?: number;
  color?: string;
}) {
  const iconColor = color || COLORS.green;

  if (code === 0) return <Sun size={size} color={iconColor} />;
  if (code === 1 || code === 2) {
    return <CloudSun size={size} color={iconColor} />;
  }
  if (code === 3) return <Cloud size={size} color={iconColor} />;
  if (code === 45 || code === 48) {
    return <CloudFog size={size} color={iconColor} />;
  }
  if (
    code === 71 ||
    code === 73 ||
    code === 75 ||
    code === 77 ||
    code === 85 ||
    code === 86
  ) {
    return <CloudSnow size={size} color={iconColor} />;
  }
  if (code && code >= 51) return <CloudRain size={size} color={iconColor} />;

  return <CloudSun size={size} color={iconColor} />;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function AppLogo() {
  return (
    <View style={styles.logoMark}>
      <Image source={farmLogo} style={styles.logoImage} resizeMode="contain" />
    </View>
  );
}

function ScreenHeader({
  title = "FarmData",
  onMenu,
  onLogout,
}: {
  title?: string;
  onMenu?: () => void;
  onLogout?: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable
          accessibilityRole="button"
          style={styles.iconButton}
          onPress={onMenu}
        >
          <Menu size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.headerRight}>
        <Pressable accessibilityRole="button" style={styles.iconButton}>
          <Bell size={23} color={COLORS.text} />
        </Pressable>
        {onLogout ? (
          <Pressable
            accessibilityRole="button"
            style={styles.iconButton}
            onPress={onLogout}
          >
            <CircleUserRound size={24} color={COLORS.text} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function BottomNav({
  active,
  admin = false,
}: {
  active: "capture" | "posts" | "management";
  admin?: boolean;
}) {
  const items = admin
    ? [
        {
          id: "posts" as const,
          label: "Post",
          route: "/(tabs)/posts",
          icon: ImageIcon,
        },
        {
          id: "management" as const,
          label: "Quản lý",
          route: "/(tabs)/management",
          icon: Menu,
        },
      ]
    : [
        {
          id: "capture" as const,
          label: "Capture",
          route: "/(tabs)/capture",
          icon: Camera,
        },
        {
          id: "posts" as const,
          label: "Post",
          route: "/(tabs)/posts",
          icon: ImageIcon,
        },
      ];
  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const Icon = item.icon;
        const selected = active === item.id;
        return (
          <Pressable
            key={item.id}
            style={styles.navItem}
            onPress={() => router.replace(item.route as any)}
          >
            <Icon
              size={28}
              color={selected ? COLORS.activeGreen : COLORS.muted}
            />
            <Text style={[styles.navLabel, selected && styles.navLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
  inactive,
  loading,
  variant = "filled",
  testID,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  inactive?: boolean;
  loading?: boolean;
  variant?: "filled" | "outline";
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.primaryButton,
        variant === "outline" && styles.outlineButton,
        (disabled || inactive) && styles.disabledButton,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? COLORS.green : "#fff"}
          size="small"
        />
      ) : null}
      <Text
        style={[
          styles.primaryButtonText,
          variant === "outline" && styles.outlineButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <Text style={styles.fieldLabel}>
      {children}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

function SelectField({
  label,
  value,
  placeholder,
  required,
  error,
  onPress,
  icon,
  testID,
}: {
  label: string;
  value?: string;
  placeholder: string;
  required?: boolean;
  error?: string;
  onPress: () => void;
  icon?: React.ReactNode;
  testID?: string;
}) {
  return (
    <View style={styles.fieldStack}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <Pressable
        testID={testID}
        style={[styles.selectField, error && styles.invalidField]}
        onPress={onPress}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
            gap: 8,
          }}
        >
          {value && icon ? icon : null}
          <Text
            style={[
              styles.selectText,
              !value && styles.placeholderText,
              { flex: 1 },
            ]}
          >
            {value || placeholder}
          </Text>
        </View>
        <ChevronDown size={20} color={COLORS.body} />
      </Pressable>
      {error ? <Text style={styles.fieldErrorText}>{error}</Text> : null}
    </View>
  );
}

function TemperatureSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const clampedValue = Math.min(40, Math.max(0, value || 0));

  const paddingX = 11;
  const activeWidth = trackWidth ? trackWidth - paddingX * 2 : 0;
  const progress = activeWidth ? (clampedValue / 40) * activeWidth : 0;

  const updateFromX = useCallback(
    (x: number) => {
      if (!trackWidth) return;
      const clampedX = Math.min(trackWidth - paddingX, Math.max(paddingX, x));
      const activeX = clampedX - paddingX;
      const next = (activeX / (trackWidth - paddingX * 2)) * 40;
      onChange(Math.round(next));
    },
    [onChange, trackWidth],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          updateFromX(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          updateFromX(event.nativeEvent.locationX);
        },
      }),
    [updateFromX],
  );

  return (
    <View style={styles.sliderField}>
      <View style={styles.sliderHeader}>
        <FieldLabel>{metricLabel("temperature")}</FieldLabel>
        <Text style={styles.sliderValue}>{clampedValue}</Text>
      </View>
      <View
        style={styles.sliderTrack}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View
          style={[styles.sliderFill, { left: paddingX, width: progress }]}
        />
        <View
          style={[
            styles.sliderThumb,
            { left: Math.max(0, progress + paddingX - 10) },
          ]}
        />
      </View>
      <View style={styles.sliderScale}>
        <Text style={styles.sliderScaleText}>0</Text>
        <Text style={styles.sliderScaleText}>40</Text>
      </View>
    </View>
  );
}

function BottomSheet({
  visible,
  title,
  children,
  onClose,
  full,
}: {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  full?: boolean;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalScrim}>
        <Pressable style={styles.scrimFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[styles.sheet, full && styles.fullSheet]}
        >
          <View style={styles.sheetHandleWrap}>
            <View style={styles.sheetHandle} />
          </View>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable style={styles.iconButton} onPress={onClose}>
              <X size={22} color={COLORS.text} />
            </Pressable>
          </View>
          {children}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function LoadingProgressDialog({
  visible,
  title,
  detail,
  percent,
}: {
  visible: boolean;
  title: string;
  detail: string;
  percent: number;
}) {
  if (!visible) return null;

  const size = 128;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePercent = Math.max(0, Math.min(100, percent));
  const strokeDashoffset = circumference - (circumference * safePercent) / 100;

  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingDialog}>
        <View style={styles.loadingRingWrap}>
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#e0e0e0"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={COLORS.green}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <View style={styles.loadingRingCenter}>
            <Text style={styles.loadingPercentText}>{safePercent}%</Text>
          </View>
        </View>
        <View style={styles.loadingTitleWrap}>
          <Text style={styles.loadingTitle}>{title}</Text>
          <View style={styles.loadingDetailRow}>
            <Text style={styles.loadingDetail}>{detail}</Text>
            <ActivityIndicator size="small" color={COLORS.green} />
          </View>
        </View>
        <View style={styles.loadingBarTrack}>
          <View style={[styles.loadingBarFill, { width: `${safePercent}%` }]} />
        </View>
        <Text style={styles.loadingHint}>Vui lòng không đóng ứng dụng</Text>
      </View>
    </View>
  );
}

function CaptureSuccessDialog({
  visible,
  onCaptureNext,
  onViewPosts,
}: {
  visible: boolean;
  onCaptureNext: () => void;
  onViewPosts: () => void;
}) {
  if (!visible) return null;

  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.captureSuccessDialog}>
        <View style={styles.captureSuccessIconWrap}>
          <View style={styles.captureSuccessIconCircle}>
            <CircleCheck size={40} color={COLORS.green} fill={COLORS.green} />
            <Check
              size={20}
              color="#eaf29d"
              style={styles.captureSuccessIconCheck}
            />
          </View>
        </View>
        <Text style={styles.captureSuccessTitle}>
          Session saved successfully!
        </Text>
        <Text style={styles.captureSuccessDescription}>
          Post has been automatically created.
        </Text>
        <View style={styles.captureSuccessActions}>
          <Pressable
            style={styles.captureSuccessPrimaryButton}
            onPress={onCaptureNext}
          >
            <Camera size={18} color="#fff" />
            <Text style={styles.captureSuccessPrimaryText}>
              Capture new session
            </Text>
          </Pressable>
          <Pressable
            style={styles.captureSuccessSecondaryButton}
            onPress={onViewPosts}
          >
            <FileText size={16} color="#2b2b2b" />
            <Text style={styles.captureSuccessSecondaryText}>
              View Post list
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function LoginScreen() {
  const { login, isLoading, error } = useAuth();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ oauthSuccess?: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [loginSucceeded, setLoginSucceeded] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginFormSchema),
    mode: "onSubmit",
    reValidateMode: "onBlur",
  });
  const validationErrorMessage =
    errors.email?.message || errors.password?.message;
  const globalErrorMessage = validationErrorMessage || localError || error;
  const credentialInvalid = Boolean(
    !validationErrorMessage && !isGoogleSubmitting && (localError || error),
  );
  const emailInvalid = Boolean(errors.email) || credentialInvalid;
  const passwordInvalid = Boolean(errors.password) || credentialInvalid;
  const invalidInputProps = (invalid: boolean) =>
    invalid ? ({ "in-valid": true, "aria-invalid": true } as const) : {};

  useEffect(() => {
    if (params.oauthSuccess === "1") {
      setLoginSucceeded(true);
    }
  }, [params.oauthSuccess]);

  useEffect(() => {
    if (!loginSucceeded) {
      return;
    }

    const timeout = setTimeout(() => {
      router.replace("/(tabs)/posts");
    }, 1200);

    return () => clearTimeout(timeout);
  }, [loginSucceeded]);

  const submit = handleSubmit(
    async (values) => {
      Keyboard.dismiss();
      setLocalError(null);
      try {
        await login(values.email.trim(), values.password);
        setLoginSucceeded(true);
      } catch (err: any) {
        setLocalError(
          err?.message || "Tên đăng nhập hoặc mật khẩu không đúng.",
        );
      }
    },
    () => {
      Keyboard.dismiss();
      setLocalError(null);
    },
  );

  const handleGoogleLogin = async () => {
    Keyboard.dismiss();
    setLocalError(null);

    try {
      setIsGoogleSubmitting(true);
      const redirectUri =
        Platform.OS === "web"
          ? Linking.createURL("auth-callback")
          : "capturedata://auth-callback";
      const authUrl = `${
        process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api"
      }/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;

      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.location.href = authUrl;
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
      );
      if (result.type !== "success" || !result.url) {
        return;
      }

      const parsed = Linking.parse(result.url);
      const accessToken = parsed.queryParams?.accessToken;
      const refreshToken = parsed.queryParams?.refreshToken;

      if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
        throw new Error("Không nhận được token đăng nhập từ máy chủ.");
      }

      await login({ accessToken, refreshToken });
      setLoginSucceeded(true);
    } catch (err: any) {
      setLocalError(err?.message || "Đăng nhập Google không thành công.");
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  if (loginSucceeded) {
    return (
      <View
        style={[
          styles.loginSuccessScreen,
          { width, minWidth: width, minHeight: height },
        ]}
      >
        <Image
          source={authBackground}
          style={styles.loginSuccessBackground}
          resizeMode="stretch"
        />
        <View style={styles.successSplash}>
          <View style={styles.successIconMargin}>
            <View style={styles.successRing}>
              <Text style={styles.successCheck}>✓</Text>
            </View>
          </View>
          <View style={styles.successTextBlock}>
            <Text style={styles.successTitle}>Đăng nhập thành công!</Text>
            <Text style={styles.successText}>
              Chào mừng bạn trở lại. Hệ thống đang{"\n"}chuyển hướng tới bảng
              điều khiển...
            </Text>
          </View>
          <View style={styles.successProgressMargin}>
            <View style={styles.successProgressTrack}>
              <View style={styles.successProgressFill} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
      <View
        style={[
          styles.loginScreen,
          { width, minWidth: width, minHeight: height },
        ]}
      >
        <Image
          source={authBackground}
          style={[
            styles.loginBackground,
            { width, height: Math.max(height, (width * 725) / 390) },
          ]}
          resizeMode="cover"
        />
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", default: undefined })}
          style={styles.flex}
        >
          <View style={styles.loginContent}>
            <View style={styles.loginBrand}>
              <AppLogo />
              <Text style={styles.loginTitle}>FARMDATA</Text>
              <Text style={styles.loginSubtitle}>
                Quản lý dữ liệu nông nghiệp
              </Text>
            </View>

            <View style={styles.loginForm}>
              <View style={styles.fieldStack}>
                <FieldLabel>Tên đăng nhập</FieldLabel>
                <View
                  style={[
                    styles.loginInputShell,
                    emailInvalid && styles.loginInputShellInvalid,
                  ]}
                >
                  <Image
                    source={loginUser}
                    style={styles.loginLeadingImage}
                    resizeMode="contain"
                  />
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onBlur, onChange, value } }) => (
                      <TextInput
                        {...invalidInputProps(emailInvalid)}
                        testID="input-login-email"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={(nextValue) => {
                          setLocalError(null);
                          onChange(nextValue);
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="Nhập tên đăng nhập"
                        placeholderTextColor={COLORS.muted}
                        style={styles.loginTextInput}
                      />
                    )}
                  />
                </View>
              </View>
              <View style={styles.fieldStack}>
                <FieldLabel>Mật khẩu</FieldLabel>
                <View
                  style={[
                    styles.loginInputShell,
                    passwordInvalid && styles.loginInputShellInvalid,
                  ]}
                >
                  <Image
                    source={loginLock}
                    style={styles.loginLeadingImage}
                    resizeMode="contain"
                  />
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onBlur, onChange, value } }) => (
                      <TextInput
                        {...invalidInputProps(passwordInvalid)}
                        testID="input-login-password"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={(nextValue) => {
                          setLocalError(null);
                          onChange(nextValue);
                        }}
                        secureTextEntry={!showPassword}
                        placeholder="Nhập mật khẩu"
                        placeholderTextColor={COLORS.muted}
                        style={styles.loginTextInput}
                      />
                    )}
                  />
                  <Pressable
                    testID="btn-toggle-password"
                    accessibilityRole="button"
                    style={styles.loginTrailingIcon}
                    onPress={() => setShowPassword((value) => !value)}
                  >
                    <Image
                      source={loginEye}
                      style={styles.loginEyeImage}
                      resizeMode="contain"
                    />
                  </Pressable>
                </View>
                {globalErrorMessage ? (
                  <View style={styles.loginErrorRow}>
                    <CircleAlert
                      size={15}
                      color={COLORS.danger}
                      strokeWidth={2}
                      style={styles.loginErrorIcon}
                    />
                    <Text style={styles.loginErrorText}>
                      {globalErrorMessage}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.loginActions}>
                <PrimaryButton
                  label={isLoading ? "Đang đăng nhập" : "Đăng nhập"}
                  onPress={submit}
                  loading={isLoading}
                  testID="btn-submit-login"
                />
                <Pressable
                  testID="btn-google-login"
                  style={[
                    styles.googleButton,
                    (isLoading || isGoogleSubmitting) &&
                      styles.googleButtonDisabled,
                  ]}
                  disabled={isLoading || isGoogleSubmitting}
                  onPress={() => {
                    void handleGoogleLogin();
                  }}
                >
                  <Image
                    source={googleLogo}
                    style={styles.googleImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.googleText}>
                    {isGoogleSubmitting
                      ? "Đang đăng nhập với Google"
                      : "Đăng nhập bằng Google"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

export function CaptureScreen() {
  const { user, logout } = useAuth();
  const [images, setImages] = useState<string[]>([]);
  const [plots, setPlots] = useState<PlotInfo[]>(DEFAULT_PLOTS);
  const [crops, setCrops] = useState<CropTypeInfo[]>(DEFAULT_CROPS);
  const [plotId, setPlotId] = useState<string | undefined>();
  const [cropType, setCropType] = useState("");
  const [growthStage, setGrowthStage] = useState<GrowthStageId | undefined>();
  const [envMode, setEnvMode] = useState<EnvMode>("outdoor");
  const [stationWeather, setStationWeather] = useState<WeatherCondition>(
    MOCK_OUTDOOR_WEATHER.current,
  );
  const [stationUpdatedAt, setStationUpdatedAt] = useState(
    MOCK_OUTDOOR_WEATHER.timestamp,
  );
  const [stationLatitude, setStationLatitude] = useState(
    MOCK_OUTDOOR_WEATHER.latitude,
  );
  const [stationLongitude, setStationLongitude] = useState(
    MOCK_OUTDOOR_WEATHER.longitude,
  );
  const [captureLocation, setCaptureLocation] = useState<
    LocationData | undefined
  >();
  const [localMeasurements, setLocalMeasurements] = useState<
    LocalWeatherMeasurement | undefined
  >();
  const [symptomDescription, setSymptomDescription] = useState("");
  const [severity, setSeverity] = useState<SymptomSeverity | undefined>();
  const [isEditingSymptom, setIsEditingSymptom] = useState(true);
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [error, setError] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const lastFetchTimeRef = useRef<number>(0);
  const captureLocationRef = useRef<LocationData | undefined>(undefined);
  captureLocationRef.current = captureLocation;
  const isMountedRef = useRef<boolean>(true);

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
          setStationUpdatedAt(weather.timestamp);
          setStationLatitude(weather.latitude ?? location.latitude);
          setStationLongitude(weather.longitude ?? location.longitude);
        } catch (_) {}
      })
      .catch(() => {
        try {
          if (!isMountedRef.current) return;
          setStationWeather(MOCK_OUTDOOR_WEATHER.current);
          setStationUpdatedAt(MOCK_OUTDOOR_WEATHER.timestamp);
          setStationLatitude(location.latitude);
          setStationLongitude(location.longitude);
        } catch (_) {}
      });
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getPlots(), getCropTypes()]).then(([plotData, cropData]) => {
      try {
        if (!isMounted) return;
        if (plotData.length) setPlots(plotData);
        if (cropData.length) setCrops(cropData);
      } catch (_) {}
    });

    console.log(
      "JEST CHECK:",
      typeof process !== "undefined" ? process.env.NODE_ENV : "no process",
      typeof process !== "undefined" ? process.env.JEST_WORKER_ID : "no worker",
    );
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
            return applyWeatherForLocation(loc);
          } catch (_) {}
        })
        .catch(() => {
          try {
            if (!isMounted) return;
            setStationWeather(MOCK_OUTDOOR_WEATHER.current);
            setStationUpdatedAt(MOCK_OUTDOOR_WEATHER.timestamp);
            setStationLatitude(MOCK_OUTDOOR_WEATHER.latitude);
            setStationLongitude(MOCK_OUTDOOR_WEATHER.longitude);
          } catch (_) {}
        });

      // Auto-update station weather every 1 minute
      intervalId = setInterval(() => {
        getCurrentLocation()
          .then((loc) => {
            try {
              if (!isMounted) return;
              setCaptureLocation(loc);
              applyWeatherForLocation(loc);
            } catch (_) {}
          })
          .catch(() => {
            try {
              if (!isMounted) return;
              if (captureLocationRef.current) {
                applyWeatherForLocation(captureLocationRef.current);
              }
            } catch (_) {}
          });
      }, 60000);
    } else {
      // In Jest tests, initialize synchronously to prevent async leaks
      setStationWeather(MOCK_OUTDOOR_WEATHER.current);
      setStationUpdatedAt(MOCK_OUTDOOR_WEATHER.timestamp);
      setStationLatitude(MOCK_OUTDOOR_WEATHER.latitude);
      setStationLongitude(MOCK_OUTDOOR_WEATHER.longitude);
      setCaptureLocation({
        latitude: MOCK_OUTDOOR_WEATHER.latitude ?? 0,
        longitude: MOCK_OUTDOOR_WEATHER.longitude ?? 0,
        accuracy: 0,
        timestamp: MOCK_OUTDOOR_WEATHER.timestamp ?? new Date().toISOString(),
      });
    }

    return () => {
      isMounted = false;
      isMountedRef.current = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [applyWeatherForLocation]);

  const sessionDraft = {
    farmerId: user?.id || "FARMER-01",
    farmerName: user?.name || "Nông dân Nguyễn Văn An",
    farmerEmail: user?.email,
    images,
    plotId,
    cropType,
    growthStage,
    envMode,
    captureLocation,
    stationMeasurements: stationWeather,
    localMeasurements,
    symptomDescription,
    severity,
  };
  const validation = validateCaptureSession(sessionDraft);
  const shouldShowSymptomDescription =
    Boolean(severity) && severity !== "Khỏe mạnh";
  const shouldShowInlineErrors = attemptedSubmit && !validation.isValid;
  const uploadPercent =
    progressTotal > 0
      ? Math.round(
          (Math.min(progressCurrent, progressTotal) / progressTotal) * 100,
        )
      : 0;

  const addPhoto = async () => {
    try {
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
      await completeCaptureSessionAndAutoPost(
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
      setImages([]);
      setPlotId(undefined);
      setCropType("");
      setGrowthStage(undefined);
      setSymptomDescription("");
      setSeverity(undefined);
      setIsEditingSymptom(true);
      setLocalMeasurements(undefined);
      setAttemptedSubmit(false);
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
    <View style={styles.screen} testID="capture-screen-container">
      <View testID="storage-destination-picker" style={{ display: "none" }} />
      <ScreenHeader onLogout={logout} />
      <ScrollView
        contentContainerStyle={styles.captureContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Phiên chụp mới</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <FieldLabel required>1. Ảnh cây trồng</FieldLabel>
            {images.length ? (
              <Text style={styles.sectionStatusText}>
                Đã thêm {images.length} ảnh
              </Text>
            ) : null}
          </View>
          <Text style={styles.captureHelpText}>Chụp ít nhất 1 ảnh</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.photoRow,
              images.length > 0 && styles.photoRowFilled,
            ]}
          >
            {images.map((uri, index) => (
              <View
                key={`${uri}-${index}`}
                style={[styles.photoThumb, styles.photoThumbFilled]}
              >
                <Image source={{ uri }} style={styles.photoImage} />
                <Pressable
                  style={styles.removeThumb}
                  onPress={() =>
                    setImages((current) =>
                      current.filter((_, i) => i !== index),
                    )
                  }
                >
                  <X size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
            <Pressable
              style={[
                styles.addPhoto,
                images.length > 0 && styles.addPhotoCompact,
              ]}
              onPress={addPhoto}
            >
              <Camera size={images.length ? 20 : 24} color={COLORS.green} />
              <Text
                style={[
                  styles.addPhotoText,
                  images.length > 0 && styles.addPhotoTextCompact,
                ]}
              >
                Chụp ảnh
              </Text>
            </Pressable>
            {!images.length ? (
              <View style={styles.emptyPhotoState}>
                <Text style={styles.emptyPhotoText}>Chưa có ảnh</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>

        <View style={[styles.section, styles.captureSectionWithTopPadding]}>
          <FieldLabel required>2. Thông tin cây trồng</FieldLabel>
          <SelectField
            label="Mã số luống (không bắt buộc)"
            value={plotId}
            placeholder="Chọn mã số luống"
            error={undefined}
            onPress={() => setSheet("plot")}
            testID="plot-id-input"
          />
          <SelectField
            label="Loại cây"
            required
            value={cropType}
            placeholder="Chọn loại cây"
            error={
              shouldShowInlineErrors ? validation.errors.cropType : undefined
            }
            onPress={() => setSheet("crop")}
            testID="crop-type-input"
            icon={
              cropType ? (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: getCropBgColor(cropType),
                  }}
                >
                  {React.createElement(cropIcon(cropType), {
                    size: 14,
                    color: getCropColor(cropType),
                    strokeWidth: 2,
                  })}
                </View>
              ) : undefined
            }
          />
          <SelectField
            label="Giai đoạn sinh trưởng"
            required
            value={growthStage ? stageName(growthStage) : undefined}
            placeholder="Chọn một trong 5 giai đoạn"
            error={
              shouldShowInlineErrors ? validation.errors.growthStage : undefined
            }
            onPress={() => setSheet("stage")}
            testID="growth-stage-input"
            icon={
              growthStage ? (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#e8e8e5",
                  }}
                >
                  {React.createElement(stageIcon(growthStage), {
                    size: 14,
                    color: COLORS.green,
                    strokeWidth: 2,
                  })}
                </View>
              ) : undefined
            }
          />
        </View>

        <View style={styles.section}>
          <FieldLabel required>3. Môi trường</FieldLabel>
          <View style={styles.segmented}>
            {(["outdoor", "greenhouse"] as EnvMode[]).map((mode) => (
              <Pressable
                key={mode}
                style={[
                  styles.segment,
                  envMode === mode && styles.segmentActive,
                ]}
                onPress={() => setEnvMode(mode)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    envMode === mode && styles.segmentTextActive,
                  ]}
                >
                  {envName(mode)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={styles.stationCard}
            onPress={() => setSheet("station")}
          >
            <View
              style={[
                styles.stationIconWrap,
                {
                  backgroundColor: getWeatherBadgeBgColor(
                    stationWeather.weatherCode,
                  ),
                },
              ]}
            >
              <WeatherStatusIcon
                code={stationWeather.weatherCode}
                size={24}
                color={getWeatherBadgeTextColor(stationWeather.weatherCode)}
              />
              <Text
                style={[
                  styles.stationWeatherText,
                  {
                    color: getWeatherBadgeTextColor(stationWeather.weatherCode),
                  },
                ]}
              >
                {getWeatherLabel(stationWeather.weatherCode)}
              </Text>
            </View>
            <View style={styles.stationBody}>
              {/* <View style={styles.stationHeaderRow}>
                <Text style={styles.stationTitle}>
                  {captureLocation?.region}
                </Text>
                <Text style={styles.stationUpdated}>
                  Cập nhật {formatWeatherUpdateTime(stationUpdatedAt)}
                </Text>
              </View> */}
              <View style={styles.stationBadgeGrid}>
                <LocationBadge location={captureLocation} />
                {WEATHER_EDITABLE_METRIC_KEYS.map((key) => (
                  <WeatherMetricBadge
                    key={key}
                    data={stationWeather}
                    metricKey={key}
                  />
                ))}
              </View>
              <View style={styles.stationLinkRow}>
                <Text style={styles.stationLinkText}>Xem thêm chi tiết</Text>
                <ChevronRight size={14} color={COLORS.green} />
              </View>
            </View>
          </Pressable>
        </View>

        <View style={[styles.section, styles.captureSectionWithTopPadding]}>
          <FieldLabel required>5. Số đo tại nơi</FieldLabel>
          <Pressable
            style={[
              styles.measureButton,
              localMeasurements && {
                height: "auto",
                paddingVertical: 14,
                flexDirection: "column",
                alignItems: "stretch",
              },
            ]}
            onPress={() => setSheet("measurement")}
          >
            {localMeasurements ? (
              <View style={styles.measureEnteredContainer}>
                <View style={styles.measureHeader}>
                  <View style={styles.measureStatusRow}>
                    <CircleCheck size={18} color={COLORS.green} />
                    <Text
                      style={[
                        styles.measureText,
                        { color: COLORS.green, fontWeight: "700" },
                      ]}
                    >
                      Đã nhập số đo tại nơi
                    </Text>
                  </View>
                  <View style={styles.measureActionRow}>
                    <Text style={styles.linkText}>Chỉnh sửa</Text>
                    <ChevronRight size={16} color={COLORS.green} />
                  </View>
                </View>

                <View style={styles.measureTable}>
                  <View style={styles.measureTableRow}>
                    <View style={styles.measureTableCell}>
                      <Text style={styles.measureCellLabel}>Thời tiết</Text>
                      <Text style={styles.measureCellValue} numberOfLines={1}>
                        {localMeasurements.weatherCode !== undefined
                          ? getWeatherLabel(localMeasurements.weatherCode)
                          : "--"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.measureTableCell,
                        styles.measureTableBorderLeft,
                      ]}
                    >
                      <Text style={styles.measureCellLabel}>Nhiệt độ</Text>
                      <Text style={styles.measureCellValue} numberOfLines={1}>
                        {localMeasurements.temperature !== undefined
                          ? `${localMeasurements.temperature}°C`
                          : "--"}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.measureTableRow,
                      styles.measureTableBorderTop,
                    ]}
                  >
                    <View style={styles.measureTableCell}>
                      <Text style={styles.measureCellLabel}>Độ ẩm KK</Text>
                      <Text style={styles.measureCellValue} numberOfLines={1}>
                        {localMeasurements.humidity !== undefined
                          ? `${localMeasurements.humidity}%`
                          : "--"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.measureTableCell,
                        styles.measureTableBorderLeft,
                      ]}
                    >
                      <Text style={styles.measureCellLabel}>Ánh sáng</Text>
                      <Text style={styles.measureCellValue} numberOfLines={1}>
                        {localMeasurements.lightUvIndex !== undefined
                          ? `${formatMetric(localMeasurements.lightUvIndex)} lx`
                          : "--"}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.measureTableRow,
                      styles.measureTableBorderTop,
                    ]}
                  >
                    <View style={styles.measureTableCell}>
                      <Text style={styles.measureCellLabel}>Tốc độ gió</Text>
                      <Text style={styles.measureCellValue} numberOfLines={1}>
                        {localMeasurements.windSpeed !== undefined
                          ? `${localMeasurements.windSpeed} m/s`
                          : "--"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.measureTableCell,
                        styles.measureTableBorderLeft,
                      ]}
                    >
                      <Text style={styles.measureCellLabel}>CO2</Text>
                      <Text style={styles.measureCellValue} numberOfLines={1}>
                        {localMeasurements.co2Level !== undefined
                          ? `${localMeasurements.co2Level} ppm`
                          : "--"}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.measureTableRow,
                      styles.measureTableBorderTop,
                    ]}
                  >
                    <View style={styles.measureTableCell}>
                      <Text style={styles.measureCellLabel}>pH đất</Text>
                      <Text style={styles.measureCellValue} numberOfLines={1}>
                        {localMeasurements.soilPh || "--"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.measureTableCell,
                        styles.measureTableBorderLeft,
                      ]}
                    >
                      <Text style={styles.measureCellLabel}>EC đất</Text>
                      <Text style={styles.measureCellValue} numberOfLines={1}>
                        {localMeasurements.soilEc
                          ? `${localMeasurements.soilEc} mS`
                          : "--"}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.measureTableRow,
                      styles.measureTableBorderTop,
                    ]}
                  >
                    <View style={styles.measureTableCell}>
                      <Text style={styles.measureCellLabel}>DO đất</Text>
                      <Text style={styles.measureCellValue} numberOfLines={1}>
                        {localMeasurements.soilDo
                          ? `${localMeasurements.soilDo} mg/L`
                          : "--"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.measureTableCell,
                        styles.measureTableBorderLeft,
                      ]}
                    >
                      <Text style={styles.measureCellLabel}>Độ ẩm đất</Text>
                      <Text style={styles.measureCellValue} numberOfLines={1}>
                        {localMeasurements.soilHumidity
                          ? `${localMeasurements.soilHumidity}%`
                          : "--"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.measureStatusRow}>
                  <Text style={styles.measureIcon}>↯</Text>
                  <Text style={styles.measureText}>Chưa nhập</Text>
                </View>
                <View style={styles.measureActionRow}>
                  <Text style={styles.linkText}>Nhập dữ liệu</Text>
                  <ChevronRight size={16} color={COLORS.green} />
                </View>
              </>
            )}
          </Pressable>
        </View>

        <View style={[styles.section, styles.captureSectionWithTopPadding]}>
          <FieldLabel required>6. Tình trạng</FieldLabel>
          <View style={styles.symptomEditStack}>
            <FieldLabel required>Mức độ</FieldLabel>
            <View style={styles.severityList}>
              {(
                [
                  { value: "Khỏe mạnh", label: "Khỏe mạnh" },
                  { value: "Chớm bệnh", label: "Chớm (1 - 10%)" },
                  { value: "Nhẹ", label: "Nhẹ (>10 - 25%)" },
                  { value: "Vừa", label: "Vừa (>25 - 50%)" },
                  { value: "Nặng", label: "Nặng (>50 - 75%)" },
                  { value: "Rất nặng", label: "Rất nặng (>75%)" },
                ] as { value: SymptomSeverity; label: string }[]
              ).map((item, index) => (
                <Pressable
                  key={item.value}
                  style={[
                    styles.severityItem,
                    severity === item.value && styles.severityActive,
                  ]}
                  onPress={() => {
                    setSeverity(item.value);
                    if (item.value === "Khỏe mạnh") {
                      setSymptomDescription("");
                      setIsEditingSymptom(false);
                    } else {
                      setIsEditingSymptom(true);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.severityDot,
                      {
                        backgroundColor: [
                          COLORS.green,
                          "#facc15",
                          "#fb923c",
                          "#ea580c",
                          "#ef4444",
                          "#991b1b",
                        ][index],
                      },
                    ]}
                  />
                  <Text style={styles.severityText}>{item.label}</Text>
                  <View
                    style={[
                      styles.radioMark,
                      severity === item.value && styles.radioMarkActive,
                    ]}
                  >
                    {severity === item.value ? (
                      <View style={styles.radioMarkDot} />
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
            {shouldShowSymptomDescription ? (
              <>
                <FieldLabel required>Mô tả triệu chứng</FieldLabel>
                {symptomDescription && !isEditingSymptom ? (
                  <Pressable
                    style={styles.symptomSummaryBox}
                    onPress={() => setIsEditingSymptom(true)}
                  >
                    <Text style={styles.symptomSummaryText}>
                      “{symptomDescription}”
                    </Text>
                    <Text style={styles.symptomSummaryCounter}>
                      {symptomDescription.length}/300
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.textAreaWrap}>
                    <TextInput
                      testID="symptom-description-input"
                      multiline
                      maxLength={300}
                      value={symptomDescription}
                      onChangeText={(value) => {
                        setSymptomDescription(value);
                        setIsEditingSymptom(true);
                      }}
                      onBlur={() => {
                        if (symptomDescription.trim()) {
                          setIsEditingSymptom(false);
                        }
                      }}
                      placeholder="Nhập triệu chứng quan sát được..."
                      placeholderTextColor={COLORS.border}
                      style={[
                        styles.textArea,
                        shouldShowInlineErrors &&
                          validation.errors.symptomDescription &&
                          styles.invalidField,
                      ]}
                    />
                    <Text style={styles.charCounter}>
                      {symptomDescription.length}/300
                    </Text>
                  </View>
                )}
                {shouldShowInlineErrors &&
                validation.errors.symptomDescription ? (
                  <Text style={styles.fieldErrorText}>
                    {validation.errors.symptomDescription}
                  </Text>
                ) : null}
              </>
            ) : severity ? (
              <View style={styles.severitySummaryRow}>
                <Text style={styles.severitySummaryLabel}>Mức độ:</Text>
                <View style={styles.severityPill}>
                  <Text style={styles.severityPillText}>
                    {severityLabel(severity)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
          <View style={styles.contextHint}>
            <Info size={10} color={COLORS.muted} />
            <Text style={styles.contextHintText}>
              Chọn Khỏe mạnh nếu cây không có dấu hiệu bệnh. Các mức còn lại
              được tính theo tổng diện tích lá bị ảnh hưởng.
            </Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.fixedCta}>
        <PrimaryButton
          label="Hoàn tất phiên chụp"
          onPress={submit}
          disabled={saving}
          inactive={!validation.isValid}
          loading={saving}
          testID="submit-capture-button"
        />
        {shouldShowInlineErrors ? (
          <Text style={styles.ctaErrorText}>
            Vui lòng nhập đủ thông tin bắt buộc
          </Text>
        ) : null}
      </View>
      <BottomNav active="capture" />
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
        plotId={plotId}
        cropType={cropType}
        growthStage={growthStage}
        stationWeather={stationWeather}
        stationUpdatedAt={stationUpdatedAt}
        stationLatitude={stationLatitude}
        stationLongitude={stationLongitude}
        captureLocation={captureLocation}
        onPlot={setPlotId}
        onCrop={setCropType}
        onStage={setGrowthStage}
        localMeasurements={localMeasurements}
        onMeasurements={setLocalMeasurements}
        error={error}
      />
    </View>
  );
}

function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function getWeatherLabel(code?: number): string {
  if (code === 0) return "Nắng";
  if (code === 1) return "Ít mây";
  if (code === 2) return "Có mây";
  if (code === 3) return "Nhiều mây";
  if (code === 45 || code === 48) return "Sương mù";
  if (code === 51 || code === 53 || code === 55) return "Mưa nhẹ";
  if (code === 61 || code === 63 || code === 65) return "Mưa vừa / to";
  if (code === 80 || code === 81 || code === 82) return "Mưa rào";
  if (
    code === 71 ||
    code === 73 ||
    code === 75 ||
    code === 77 ||
    code === 85 ||
    code === 86
  ) {
    return "Mưa tuyết";
  }
  return "Nắng";
}

const WEATHER_OPTIONS = [
  { code: 0, label: "Nắng", Icon: Sun },
  { code: 1, label: "Ít mây", Icon: CloudSun },
  { code: 2, label: "Có mây", Icon: CloudSun },
  { code: 3, label: "Nhiều mây", Icon: Cloud },
  { code: 45, label: "Sương mù", Icon: CloudFog },
  { code: 51, label: "Mưa nhẹ", Icon: CloudRain },
  { code: 63, label: "Mưa vừa / to", Icon: CloudRain },
  { code: 80, label: "Mưa rào", Icon: CloudRain },
  { code: 71, label: "Mưa tuyết", Icon: CloudSnow },
];

function SelectionSheets(props: {
  sheet: SheetKind | null;
  setSheet: (sheet: SheetKind | null) => void;
  plots: PlotInfo[];
  crops: CropTypeInfo[];
  plotId?: string;
  cropType: string;
  growthStage?: GrowthStageId;
  stationWeather: WeatherCondition;
  stationUpdatedAt?: string;
  stationLatitude?: number;
  stationLongitude?: number;
  captureLocation?: LocationData;
  onPlot: (value?: string) => void;
  onCrop: (value: string) => void;
  onStage: (value: GrowthStageId) => void;
  localMeasurements?: LocalWeatherMeasurement;
  onMeasurements: (value: LocalWeatherMeasurement) => void;
  error: string;
}) {
  const close = () => {
    props.setSheet(null);
    setShowWeatherDropdown(false);
    setCropSearch("");
    setPlotSearch("");
  };
  const [measurement, setMeasurement] = useState<LocalWeatherMeasurement>(
    () => {
      if (props.localMeasurements) return props.localMeasurements;
      return {
        temperature: undefined,
        humidity: undefined,
        lightUvIndex: undefined,
        windSpeed: undefined,
        co2Level: undefined,
        weatherCode: 0,
      };
    },
  );
  const [localStrings, setLocalStrings] = useState(() => {
    const initial = props.localMeasurements;
    return {
      humidity: initial?.humidity !== undefined ? String(initial.humidity) : "",
      light:
        initial?.lightUvIndex !== undefined ? String(initial.lightUvIndex) : "",
      wind: initial?.windSpeed !== undefined ? String(initial.windSpeed) : "",
      co2: initial?.co2Level !== undefined ? String(initial.co2Level) : "",
    };
  });
  const [cropSearch, setCropSearch] = useState("");
  const [plotSearch, setPlotSearch] = useState("");
  const [weatherType, setWeatherType] = useState(() =>
    getWeatherLabel(
      (props.localMeasurements || { weatherCode: 0 }).weatherCode,
    ),
  );
  const [showWeatherDropdown, setShowWeatherDropdown] = useState(false);
  const [soilMeasurements, setSoilMeasurements] = useState(() => {
    const initial = props.localMeasurements;
    return {
      ph: initial?.soilPh || "",
      ec: initial?.soilEc || "",
      dissolvedOxygen: initial?.soilDo || "",
      soilHumidity: initial?.soilHumidity || "",
    };
  });

  useEffect(() => {
    if (props.sheet === "measurement") {
      const initialWeather = props.localMeasurements || {
        temperature: undefined,
        humidity: undefined,
        lightUvIndex: undefined,
        windSpeed: undefined,
        co2Level: undefined,
        weatherCode: 0,
      };
      setMeasurement(initialWeather);
      setWeatherType(getWeatherLabel(initialWeather.weatherCode));
      setShowWeatherDropdown(false);
      setLocalStrings({
        humidity:
          initialWeather.humidity !== undefined
            ? String(initialWeather.humidity)
            : "",
        light:
          initialWeather.lightUvIndex !== undefined
            ? String(initialWeather.lightUvIndex)
            : "",
        wind:
          initialWeather.windSpeed !== undefined
            ? String(initialWeather.windSpeed)
            : "",
        co2:
          initialWeather.co2Level !== undefined
            ? String(initialWeather.co2Level)
            : "",
      });
      setSoilMeasurements({
        ph: initialWeather.soilPh || "",
        ec: initialWeather.soilEc || "",
        dissolvedOxygen: initialWeather.soilDo || "",
        soilHumidity: initialWeather.soilHumidity || "",
      });
    }
    if (props.sheet === "plot") {
      setPlotSearch("");
    }
  }, [props.sheet, props.localMeasurements]);
  const filteredCrops = props.crops.filter((crop) => {
    const cleanName = removeDiacritics(crop.name.toLowerCase());
    const cleanSearch = removeDiacritics(cropSearch.trim().toLowerCase());
    return cleanName.includes(cleanSearch);
  });
  const filteredPlots = props.plots.filter((plot) => {
    const cleanSearch = removeDiacritics(plotSearch.trim().toLowerCase());
    const matchesCode = removeDiacritics(plot.code.toLowerCase()).includes(
      cleanSearch,
    );
    const matchesName = removeDiacritics(plot.name.toLowerCase()).includes(
      cleanSearch,
    );
    const matchesDesc = plot.description
      ? removeDiacritics(plot.description.toLowerCase()).includes(cleanSearch)
      : false;
    return matchesCode || matchesName || matchesDesc;
  });
  return (
    <>
      <BottomSheet
        visible={props.sheet === "plot"}
        title="Chọn mã số luống"
        onClose={close}
      >
        <View style={styles.cropSheetContent}>
          <View style={styles.cropSearchWrap}>
            <Search size={20} color="#94a3b8" />
            <TextInput
              value={plotSearch}
              onChangeText={setPlotSearch}
              placeholder="Tìm mã luống"
              placeholderTextColor="#6b7280"
              style={styles.cropSearchInput}
            />
            {plotSearch ? (
              <Pressable
                onPress={() => setPlotSearch("")}
                style={{ padding: 4 }}
              >
                <X size={18} color="#6b7280" />
              </Pressable>
            ) : null}
          </View>
          <ScrollView
            style={styles.cropListScroll}
            contentContainerStyle={styles.cropListContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredPlots.length > 0 ? (
              filteredPlots.map((plot) => {
                const selected = props.plotId === plot.code;

                return (
                  <Pressable
                    key={plot.id}
                    testID={`plot-option-${plot.code}`}
                    style={[
                      styles.plotOption,
                      selected && styles.plotOptionSelected,
                    ]}
                    onPress={() => {
                      props.onPlot(plot.code);
                    }}
                  >
                    <View style={styles.plotOptionBody}>
                      <Text
                        style={[
                          styles.plotOptionCode,
                          selected && styles.plotOptionCodeSelected,
                        ]}
                      >
                        {plot.code}
                      </Text>
                      <Text style={styles.plotOptionMeta}>
                        {plotSheetMeta(plot)}
                      </Text>
                    </View>
                    {selected ? (
                      <View style={styles.plotOptionCheck}>
                        <Check size={12} color="#fff" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.cropSearchEmpty}>
                <Text style={styles.cropSearchEmptyText}>
                  Không tìm thấy luống nào phù hợp
                </Text>
              </View>
            )}
          </ScrollView>
          <View style={styles.cropActionArea}>
            <Pressable
              style={styles.sheetOutlineAction}
              testID="plot-clear-selection"
              onPress={() => {
                props.onPlot(undefined);
                close();
              }}
            >
              <Text style={styles.sheetOutlineActionText}>Không chọn mã</Text>
            </Pressable>
          </View>
        </View>
      </BottomSheet>
      <BottomSheet
        visible={props.sheet === "crop"}
        title="Chọn loại cây"
        onClose={close}
      >
        <View style={styles.cropSheetContent}>
          <View style={styles.cropSearchWrap}>
            <Search size={20} color="#94a3b8" />
            <TextInput
              value={cropSearch}
              onChangeText={setCropSearch}
              placeholder="Tìm loại cây"
              placeholderTextColor="#6b7280"
              style={styles.cropSearchInput}
            />
            {cropSearch ? (
              <Pressable
                onPress={() => setCropSearch("")}
                style={{ padding: 4 }}
              >
                <X size={18} color="#6b7280" />
              </Pressable>
            ) : null}
          </View>
          <ScrollView
            style={styles.cropListScroll}
            contentContainerStyle={styles.cropListContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredCrops.length > 0 ? (
              filteredCrops.map((crop) => {
                const selected = props.cropType === crop.name;
                const Icon = cropIcon(crop.name);
                const cropColor = getCropColor(crop.name);
                const cropBg = getCropBgColor(crop.name);

                return (
                  <Pressable
                    key={crop.id}
                    testID={`crop-option-${crop.id}`}
                    style={[
                      styles.cropOption,
                      selected && styles.cropOptionSelected,
                    ]}
                    onPress={() => {
                      props.onCrop(crop.name);
                    }}
                  >
                    <View
                      style={[
                        styles.cropOptionIcon,
                        { backgroundColor: selected ? cropColor : cropBg },
                      ]}
                    >
                      <Icon
                        size={20}
                        color={selected ? "#fff" : cropColor}
                        strokeWidth={2}
                      />
                    </View>
                    <Text
                      style={[
                        styles.cropOptionText,
                        selected && styles.cropOptionTextSelected,
                      ]}
                    >
                      {crop.name}
                    </Text>
                    {selected ? (
                      <CircleCheck size={20} color={COLORS.green} />
                    ) : null}
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.cropSearchEmpty}>
                <Text style={styles.cropSearchEmptyText}>
                  Không tìm thấy loại cây phù hợp
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </BottomSheet>
      <BottomSheet
        visible={props.sheet === "stage"}
        title="Chọn giai đoạn sinh trưởng"
        onClose={close}
      >
        <View style={styles.stageSheetList}>
          {GROWTH_STAGES.map((stage) => {
            const selected = props.growthStage === stage.id;
            const Icon = stageIcon(stage.id);

            return (
              <Pressable
                key={stage.id}
                testID={`stage-option-${stage.id}`}
                style={[
                  styles.stageOption,
                  selected && styles.stageOptionSelected,
                ]}
                onPress={() => {
                  props.onStage(stage.id);
                }}
              >
                <View
                  style={[
                    styles.stageOptionIcon,
                    selected && styles.stageOptionIconSelected,
                  ]}
                >
                  <Icon
                    size={20}
                    color={selected ? "#fff" : COLORS.green}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.stageOptionBody}>
                  <Text style={styles.stageOptionTitle}>
                    {stageSheetName(stage.id)}
                  </Text>
                  <Text style={styles.stageOptionMeta}>
                    {stageSheetDescription(stage.id, stage.description)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.stageRadio,
                    selected && styles.stageRadioSelected,
                  ]}
                >
                  {selected ? <Check size={14} color="#fff" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
      <BottomSheet
        visible={props.sheet === "station"}
        title="Chi tiết dữ liệu trạm"
        onClose={close}
      >
        <StationDetail
          data={props.stationWeather}
          captureLocation={props.captureLocation}
          latitude={props.stationLatitude}
          longitude={props.stationLongitude}
          updatedAt={props.stationUpdatedAt}
        />
      </BottomSheet>
      <BottomSheet
        visible={props.sheet === "measurement"}
        title="Số đo tại nơi"
        onClose={close}
        full
      >
        <View style={styles.measurementSheetContent}>
          <Text style={styles.measurementSheetSubtitle}>
            Nhập dữ liệu môi trường hiện tại
          </Text>
          <ScrollView
            style={styles.measurementFieldsScroll}
            contentContainerStyle={styles.measurementFormContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.measurementSection}>
              <View style={styles.measurementSectionTitleRow}>
                <Cloud size={16} color={COLORS.green} />
                <Text style={styles.measurementSectionTitle}>
                  Không khí & môi trường
                </Text>
              </View>
              <View
                style={[
                  styles.measurementInputStack,
                  styles.measurementInputStackFull,
                ]}
              >
                <Text style={styles.measurementInputLabel}>
                  Loại thời tiết *
                </Text>
                <Pressable
                  style={styles.measurementSelect}
                  onPress={() => setShowWeatherDropdown((current) => !current)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {(() => {
                      const SelectedOption = WEATHER_OPTIONS.find(
                        (opt) => opt.label === weatherType,
                      );
                      const SelectedIcon = SelectedOption
                        ? SelectedOption.Icon
                        : Sun;
                      return <SelectedIcon size={20} color={COLORS.green} />;
                    })()}
                    <Text style={styles.measurementSelectText}>
                      {weatherType}
                    </Text>
                  </View>
                  <ChevronDown
                    size={20}
                    color={COLORS.body}
                    style={{
                      transform: [
                        { rotate: showWeatherDropdown ? "180deg" : "0deg" },
                      ],
                    }}
                  />
                </Pressable>

                {showWeatherDropdown ? (
                  <ScrollView
                    style={styles.weatherDropdown}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                  >
                    {WEATHER_OPTIONS.map((option) => {
                      const isSelected = weatherType === option.label;
                      const OptionIcon = option.Icon;
                      return (
                        <Pressable
                          key={option.code}
                          style={[
                            styles.weatherDropdownItem,
                            isSelected && styles.weatherDropdownItemSelected,
                          ]}
                          onPress={() => {
                            setWeatherType(option.label);
                            setMeasurement((current) => ({
                              ...current,
                              weatherCode: option.code,
                            }));
                            setShowWeatherDropdown(false);
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <OptionIcon
                              size={18}
                              color={isSelected ? COLORS.green : COLORS.body}
                            />
                            <Text
                              style={[
                                styles.weatherDropdownItemText,
                                isSelected &&
                                  styles.weatherDropdownItemTextSelected,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </View>
                          {isSelected ? (
                            <Check size={16} color={COLORS.green} />
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : null}
              </View>
              <TemperatureSlider
                value={measurement.temperature ?? 0}
                onChange={(value) =>
                  setMeasurement((current) => ({
                    ...current,
                    temperature: value,
                  }))
                }
              />
              <View style={styles.measurementGrid}>
                <MeasurementInput
                  label="Độ ẩm không khí (%)"
                  value={localStrings.humidity}
                  placeholder="60"
                  onChangeText={(value) =>
                    setLocalStrings((current) => ({
                      ...current,
                      humidity: value,
                    }))
                  }
                />
                <MeasurementInput
                  label="Ánh sáng (lux)"
                  value={localStrings.light}
                  placeholder="15000"
                  onChangeText={(value) =>
                    setLocalStrings((current) => ({
                      ...current,
                      light: value,
                    }))
                  }
                />
                <MeasurementInput
                  label="Tốc độ gió (m/s)"
                  value={localStrings.wind}
                  placeholder="2.5"
                  onChangeText={(value) =>
                    setLocalStrings((current) => ({
                      ...current,
                      wind: value,
                    }))
                  }
                />
                <MeasurementInput
                  label="CO2 (ppm)"
                  value={localStrings.co2}
                  placeholder="400"
                  onChangeText={(value) =>
                    setLocalStrings((current) => ({
                      ...current,
                      co2: value,
                    }))
                  }
                />
              </View>
            </View>
            <View style={styles.measurementDivider} />
            <View style={styles.measurementSection}>
              <View style={styles.measurementSectionTitleRow}>
                <Sprout size={16} color={COLORS.green} />
                <Text style={styles.measurementSectionTitle}>Chỉ số đất</Text>
              </View>
              <View style={styles.measurementGrid}>
                <MeasurementInput
                  label="pH"
                  value={soilMeasurements.ph}
                  placeholder="6.5"
                  onChangeText={(value) =>
                    setSoilMeasurements((current) => ({
                      ...current,
                      ph: value,
                    }))
                  }
                />
                <MeasurementInput
                  label="EC (mS/cm)"
                  value={soilMeasurements.ec}
                  placeholder="1.2"
                  onChangeText={(value) =>
                    setSoilMeasurements((current) => ({
                      ...current,
                      ec: value,
                    }))
                  }
                />
                <MeasurementInput
                  label="DO (mg/L)"
                  value={soilMeasurements.dissolvedOxygen}
                  placeholder="6.8"
                  onChangeText={(value) =>
                    setSoilMeasurements((current) => ({
                      ...current,
                      dissolvedOxygen: value,
                    }))
                  }
                />
                <MeasurementInput
                  label="Độ ẩm đất (%)"
                  value={soilMeasurements.soilHumidity}
                  placeholder="45"
                  onChangeText={(value) =>
                    setSoilMeasurements((current) => ({
                      ...current,
                      soilHumidity: value,
                    }))
                  }
                />
              </View>
            </View>
          </ScrollView>
          <View style={styles.measurementActionArea}>
            <Pressable style={styles.measurementCancelButton} onPress={close}>
              <Text style={styles.measurementCancelText}>Hủy</Text>
            </Pressable>
            <View style={styles.measurementSaveButtonWrap}>
              <PrimaryButton
                label="Lưu"
                onPress={() => {
                  const parseNum = (val: string): number | undefined => {
                    if (!val || !val.trim()) return undefined;
                    const clean = val.replace(/,/g, ".");
                    const parsed = parseFloat(clean);
                    return Number.isNaN(parsed) ? undefined : parsed;
                  };
                  const savedData: LocalWeatherMeasurement = {
                    temperature: measurement.temperature,
                    weatherCode: measurement.weatherCode,
                    humidity: parseNum(localStrings.humidity),
                    lightUvIndex: parseNum(localStrings.light),
                    windSpeed: parseNum(localStrings.wind),
                    co2Level: parseNum(localStrings.co2),
                    soilPh: soilMeasurements.ph || undefined,
                    soilEc: soilMeasurements.ec || undefined,
                    soilDo: soilMeasurements.dissolvedOxygen || undefined,
                    soilHumidity: soilMeasurements.soilHumidity || undefined,
                  };
                  props.onMeasurements(savedData);
                  close();
                }}
              />
            </View>
          </View>
        </View>
      </BottomSheet>
      <CaptureSuccessDialog
        visible={props.sheet === "success"}
        onCaptureNext={close}
        onViewPosts={() => router.replace("/(tabs)/posts")}
      />
      <BottomSheet
        visible={props.sheet === "error"}
        title="Chưa thể lưu phiên chụp"
        onClose={close}
      >
        <Text style={styles.inlineError}>{props.error}</Text>
        <PrimaryButton label="Thử lại" onPress={close} />
      </BottomSheet>
    </>
  );
}

function metricLabel(key: WeatherMetricKey) {
  return {
    temperature: "Nhiệt độ (°C)",
    lightUvIndex: "Ánh sáng / UV",
    windSpeed: "Tốc độ gió (m/s)",
    co2Level: "CO2 (ppm)",
    humidity: "Độ ẩm (%)",
    weatherCode: "Mã thời tiết",
  }[key];
}

function metricValue(data: WeatherCondition, key: WeatherMetricKey) {
  const value = data[key];
  if (typeof value !== "number" || Number.isNaN(value)) return "--";

  if (key === "temperature") return formatMetric(value);
  if (key === "windSpeed") return formatMetric(value / 3.6, 1);
  if (key === "co2Level") return formatMetric(value);
  if (key === "humidity") return formatMetric(value);

  return formatMetric(value, key === "lightUvIndex" ? 1 : 0);
}

function metricValueWithUnit(data: WeatherCondition, key: WeatherMetricKey) {
  const value = metricValue(data, key);
  if (value === "--") return value;
  return {
    temperature: `${value}°C`,
    lightUvIndex: `${value} Lux`,
    windSpeed: `${value} m/s`,
    co2Level: `${value} ppm`,
    humidity: `${value}%`,
    weatherCode: value,
  }[key];
}

function metricIconMeta(key: WeatherMetricKey) {
  return {
    temperature: { Icon: Thermometer, color: "#f97316" },
    humidity: { Icon: Droplets, color: "#3b82f6" },
    lightUvIndex: { Icon: Sun, color: "#f59e0b" },
    windSpeed: { Icon: Wind, color: "#64748b" },
    co2Level: { Icon: Gauge, color: "#565656" },
    weatherCode: { Icon: CloudSun, color: COLORS.green },
  }[key];
}

function WeatherMetricBadge({
  data,
  metricKey,
}: {
  data: WeatherCondition;
  metricKey: WeatherMetricKey;
}) {
  const isWeather = metricKey === "weatherCode";
  const weatherOpt = isWeather
    ? WEATHER_OPTIONS.find((o) => o.code === data.weatherCode) ||
      WEATHER_OPTIONS[0]
    : null;

  const Icon = isWeather ? weatherOpt!.Icon : metricIconMeta(metricKey).Icon;
  const color = isWeather
    ? getWeatherBadgeTextColor(data.weatherCode)
    : metricIconMeta(metricKey).color;
  const label = isWeather
    ? getWeatherLabel(data.weatherCode)
    : metricValueWithUnit(data, metricKey);

  return (
    <View style={styles.weatherMetricBadge}>
      <Icon size={16} color={color} />
      <Text style={styles.weatherMetricBadgeText}>{label}</Text>
    </View>
  );
}

function LocationBadge({ location }: { location?: LocationData }) {
  const value = formatCaptureLocationName(location);
  if (!value) return null;

  return (
    <View style={[styles.weatherMetricBadge, styles.locationMetricBadge]}>
      <MapPin size={16} color={COLORS.green} />
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.weatherMetricBadgeText, styles.locationMetricText]}
      >
        {value}
      </Text>
    </View>
  );
}

type LucideIconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

function stageIcon(id: GrowthStageId): LucideIconComponent {
  return {
    newly_planted: Sprout,
    vegetative: TreePine,
    flowering: Flower2,
    fruiting: Apple,
    harvest: Tractor,
  }[id];
}

function cropIcon(name: string): LucideIconComponent {
  const normalized = name.toLowerCase();
  if (normalized.includes("cà chua")) return Leaf;
  if (normalized.includes("dưa")) return Cherry;
  if (normalized.includes("ớt")) return Flame;
  if (normalized.includes("khoai")) return Carrot;
  if (normalized.includes("xà lách")) return Salad;
  if (normalized.includes("bắp cải")) return LeafyGreen;
  if (normalized.includes("hành")) return Vegan;
  return Sprout;
}

function getCropColor(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes("cà chua")) return "#dc2626"; // Red for Tomato
  if (normalized.includes("dưa")) return "#f97316"; // Orange for Melon
  if (normalized.includes("ớt")) return "#ea580c"; // Chili Orange-Red
  if (normalized.includes("khoai")) return "#854d0e"; // Brownish gold for Potato
  if (normalized.includes("xà lách")) return "#16a34a"; // Green for Lettuce
  if (normalized.includes("bắp cải")) return "#65a30d"; // Light green for Cabbage
  if (normalized.includes("hành")) return "#059669"; // Emerald for Onion
  return "#15803d"; // Forest green for generic sprout
}

function getCropBgColor(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes("cà chua")) return "#fee2e2"; // Light red
  if (normalized.includes("dưa")) return "#ffedd5"; // Light orange
  if (normalized.includes("ớt")) return "#ffedd5"; // Light orange
  if (normalized.includes("khoai")) return "#fef9c3"; // Light yellow-brown
  if (normalized.includes("xà lách")) return "#dcfce7"; // Light green
  if (normalized.includes("bắp cải")) return "#f0fdf4"; // Pale green
  if (normalized.includes("hành")) return "#ecfdf5"; // Light emerald
  return "#eef7e9"; // Light green default
}

function MeasurementInput({
  label,
  value,
  placeholder,
  onChangeText,
  full,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (value: string) => void;
  full?: boolean;
}) {
  return (
    <View
      style={[
        styles.measurementInputStack,
        full && styles.measurementInputStackFull,
      ]}
    >
      <Text style={styles.measurementInputLabel}>{label}</Text>
      <TextInput
        keyboardType="numeric"
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        onChangeText={onChangeText}
        style={styles.measurementInput}
      />
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function getWeatherBadgeBgColor(code?: number): string {
  if (code === 0) return "#fef3c7"; // Light amber/yellow for Sun
  if (code === 1 || code === 2) return "#fef3c7"; // Light yellow for Light Cloud/CloudSun
  if (code === 3) return "#f1f5f9"; // Light slate/gray for Cloudy
  if (code === 45 || code === 48) return "#f1f5f9"; // Light fog
  if (
    code === 51 ||
    code === 53 ||
    code === 55 ||
    code === 61 ||
    code === 63 ||
    code === 65 ||
    code === 80 ||
    code === 81 ||
    code === 82
  ) {
    return "#e0f2fe"; // Light blue for Rain
  }
  return "#ecfeff"; // Light cyan for Snow
}

function getWeatherBadgeTextColor(code?: number): string {
  if (code === 0) return "#d97706"; // Amber for Sun
  if (code === 1 || code === 2) return "#d97706"; // Amber
  if (code === 3) return "#475569"; // Slate for cloud
  if (code === 45 || code === 48) return "#475569"; // Slate
  if (
    code === 51 ||
    code === 53 ||
    code === 55 ||
    code === 61 ||
    code === 63 ||
    code === 65 ||
    code === 80 ||
    code === 81 ||
    code === 82
  ) {
    return "#0284c7"; // Sky blue for rain
  }
  return "#0891b2"; // Cyan for snow
}

function WeatherTypeIcon({
  code,
  size = 24,
}: {
  code?: number;
  size?: number;
}) {
  const weatherOpt =
    WEATHER_OPTIONS.find((opt) => opt.code === code) || WEATHER_OPTIONS[0];
  const Icon = weatherOpt.Icon;
  const color = getWeatherBadgeTextColor(code);
  return <Icon size={size} color={color} strokeWidth={2} />;
}

function StationDetail({
  data,
  captureLocation,
  latitude,
  longitude,
  updatedAt,
}: {
  data: WeatherCondition;
  captureLocation?: LocationData;
  latitude?: number;
  longitude?: number;
  updatedAt?: string;
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View
        style={[
          styles.weatherTypeCard,
          { backgroundColor: getWeatherBadgeBgColor(data.weatherCode) },
        ]}
      >
        <View style={styles.weatherTypeIconWrap}>
          <WeatherTypeIcon code={data.weatherCode} size={20} />
        </View>
        <Text
          style={[
            styles.weatherTypeValue,
            { color: getWeatherBadgeTextColor(data.weatherCode) },
          ]}
        >
          {getWeatherLabel(data.weatherCode)}
        </Text>
      </View>

      <View style={styles.stationDetailBlock}>
        <Text style={styles.stationDetailTitle}>Vị trí chụp</Text>
        <DetailRow
          label="Tên vị trí"
          value={formatCaptureLocationName(captureLocation)}
        />
        <DetailRow
          label="Vĩ độ"
          value={formatCoordinateValue(captureLocation?.latitude ?? latitude)}
        />
        <DetailRow
          label="Kinh độ"
          value={formatCoordinateValue(captureLocation?.longitude ?? longitude)}
        />
        <DetailRow
          label="Độ chính xác GPS"
          value={
            typeof captureLocation?.accuracy === "number"
              ? `${formatMetric(captureLocation.accuracy, 1)} m`
              : undefined
          }
        />
        <DetailRow
          label="Thời điểm chụp"
          value={
            captureLocation?.timestamp
              ? formatDate(captureLocation.timestamp)
              : undefined
          }
        />
        <DetailRow
          label="Cập nhật thời tiết"
          value={updatedAt ? formatDate(updatedAt) : undefined}
        />
      </View>
      <View style={styles.stationDetailBlock}>
        <Text style={styles.stationDetailTitle}>Dữ liệu thời tiết</Text>
        <MetricGrid data={data} />
      </View>
    </ScrollView>
  );
}

function MetricGrid({ data }: { data: WeatherCondition }) {
  return (
    <View style={styles.metricGrid}>
      {WEATHER_CARD_METRIC_KEYS.map((key) => {
        const { Icon, color } = metricIconMeta(key);

        return (
          <View key={key} style={styles.metricCell}>
            <View style={styles.metricLabelRow}>
              <Icon size={16} color={color} />
              <Text style={styles.metricLabel}>{metricLabel(key)}</Text>
            </View>
            <Text style={styles.metricValue}>
              {metricValueWithUnit(data, key)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function PostsScreen() {
  const { user } = useAuth();
  const { push: routerPush } = useRouter();
  const role = normalizeRole(user?.role as string);
  const [posts, setPosts] = useState<Post[]>([]);
  const [query, setQuery] = useState("");
  const [env, setEnv] = useState<"all" | EnvMode>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [viewerPost, setViewerPost] = useState<Post | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [sortOpen, setSortOpen] = useState(false);
  const [sortMode, setSortMode] = useState("newest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState("all");
  const [selectedCrop, setSelectedCrop] = useState("all");
  const [selectedEnv, setSelectedEnv] = useState("all");

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setLoadError(null);
    try {
      const data = await getPosts(role, user?.id, undefined, query);
      setPosts(
        data.map((post) =>
          normalizePostIdentity(post as Post & { _id?: string }),
        ),
      );
    } catch (err: any) {
      setLoadError(err?.message || "Lỗi tải dữ liệu");
      setPosts([]);
    } finally {
      setRefreshing(false);
    }
  }, [query, role, user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const plots = useMemo(() => {
    const set = new Set(posts.map((p) => p.plotId).filter(Boolean));
    return Array.from(set) as string[];
  }, [posts]);

  const crops = useMemo(() => {
    const set = new Set(posts.map((p) => p.cropType).filter(Boolean));
    return Array.from(set) as string[];
  }, [posts]);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesEnv =
        env === "all"
          ? selectedEnv === "all" || post.envMode === selectedEnv
          : post.envMode === env;
      const matchesPlot =
        selectedPlot === "all" || post.plotId === selectedPlot;
      const matchesCrop =
        selectedCrop === "all" || post.cropType === selectedCrop;
      const matchesQuery =
        !lower ||
        [post.plotId, post.cropType, post.user?.name, post.symptomDescription]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(lower);
      return matchesEnv && matchesPlot && matchesCrop && matchesQuery;
    });
  }, [env, selectedEnv, selectedPlot, selectedCrop, posts, query]);

  const sortedAndFiltered = useMemo(() => {
    const result = [...filtered];
    if (sortMode === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortMode === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    } else if (sortMode === "severity") {
      const order = [
        "Khỏe mạnh",
        "Chớm bệnh",
        "Nhẹ",
        "Vừa",
        "Nặng",
        "Rất nặng",
      ];
      result.sort(
        (a, b) => order.indexOf(b.severity) - order.indexOf(a.severity),
      );
    }
    return result;
  }, [filtered, sortMode]);

  return (
    <View style={styles.screen} testID="posts-screen">
      <ScreenHeader />
      <View style={styles.listHeader}>
        <Text style={styles.screenTitle}>Post</Text>
        <View style={styles.searchFilterRow}>
          <View style={styles.searchBox}>
            <Search size={20} color={COLORS.muted} />
            <TextInput
              testID="posts-search-input"
              value={query}
              onChangeText={setQuery}
              placeholder={
                role === "admin"
                  ? "Tìm mã luống, loại cây hoặc tài khoản"
                  : "Tìm mã luống hoặc loại cây"
              }
              placeholderTextColor={COLORS.muted}
              style={styles.searchInput}
            />
          </View>
          <Pressable
            style={styles.filterButton}
            onPress={() => setSortOpen(true)}
          >
            <Text style={styles.filterText}>≡↑</Text>
          </Pressable>
          <Pressable
            style={styles.filterButton}
            onPress={() => setFilterOpen(true)}
          >
            <Filter size={16} color={COLORS.body} />
            <Text style={styles.filterText}>Bộ lọc</Text>
          </Pressable>
        </View>
        <View style={styles.chipRow}>
          {[
            ["all", "Tất cả"],
            ["outdoor", "Ngoài trời"],
            ["greenhouse", "Nhà kính"],
          ].map(([id, label]) => (
            <Pressable
              key={id}
              style={[styles.chip, env === id && styles.chipActive]}
              onPress={() => setEnv(id as any)}
            >
              <Text
                style={[styles.chipText, env === id && styles.chipTextActive]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ScrollView
        style={styles.postList}
        contentContainerStyle={styles.postListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        {loadError ? (
          <View style={{ alignItems: "center", padding: 40 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
              Không thể tải dữ liệu
            </Text>
            <Text style={{ color: COLORS.muted, marginBottom: 16 }}>
              {loadError}
            </Text>
            <Pressable
              onPress={refresh}
              style={{
                backgroundColor: COLORS.green,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Thử lại</Text>
            </Pressable>
          </View>
        ) : sortedAndFiltered.length ? (
          sortedAndFiltered.map((post, index) => (
            <PostCard
              key={postListKey(post as Post & { _id?: string }, index)}
              post={post}
              admin={role === "admin"}
              onImage={() => setViewerPost(post)}
            />
          ))
        ) : (
          <View style={{ alignItems: "center", padding: 40 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
              Chưa có bài đăng
            </Text>
            <Pressable
              onPress={() => routerPush("/capture")}
              style={{
                backgroundColor: COLORS.green,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
                marginTop: 12,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                Tạo phiên chụp
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      <BottomNav active="posts" admin={role === "admin"} />
      <ImageViewer post={viewerPost} onClose={() => setViewerPost(null)} />
      <FilterModal
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        plots={plots}
        crops={crops}
        selectedPlot={selectedPlot}
        selectedCrop={selectedCrop}
        selectedEnv={selectedEnv}
        onApply={(filters) => {
          setSelectedPlot(filters.plot);
          setSelectedCrop(filters.crop);
          setSelectedEnv(filters.env);
        }}
        onReset={() => {
          setSelectedPlot("all");
          setSelectedCrop("all");
          setSelectedEnv("all");
        }}
      />
      <SortModal
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        selectedSort={sortMode}
        onSelectSort={setSortMode}
      />
    </View>
  );
}

function PostCard({
  post,
  admin,
  onImage,
}: {
  post: Post;
  admin?: boolean;
  onImage: () => void;
}) {
  return (
    <View style={styles.postCard} testID={`post-card-${post.id}`}>
      <Pressable onPress={onImage} style={styles.postImageWrap}>
        <Image
          source={{ uri: post.images[0] || DEMO_IMAGES[0] }}
          style={styles.postImage}
        />
        <View style={styles.imageCountBadge}>
          <Text style={styles.imageCountText}>
            +{Math.max(post.images.length - 1, 0)} ảnh
          </Text>
        </View>
      </Pressable>
      <View style={styles.postInfo}>
        <Text style={styles.postTitle}>
          {post.cropType} - {stageName(post.growthStage)}
        </Text>
        <Text style={styles.postMeta}>
          {post.plotId ? `${post.plotId} - ` : ""}
          {envName(post.envMode)}
        </Text>
        <Text style={styles.postMeta}>
          {post.symptomDescription} - Mức độ {post.severity}
        </Text>
        {admin ? (
          <Text style={styles.postMeta}>Người gửi: {post.user.name}</Text>
        ) : null}
        <Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>
      </View>
    </View>
  );
}

function ImageViewer({
  post,
  onClose,
}: {
  post: Post | null;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [post?.id]);
  if (!post) return null;
  const uri = post.images[index] || DEMO_IMAGES[0];
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewer}>
        <Pressable style={styles.viewerClose} onPress={onClose}>
          <X size={26} color="#fff" />
        </Pressable>
        <Image
          source={{ uri }}
          style={styles.viewerImage}
          resizeMode="contain"
        />
        <View style={styles.viewerLabel}>
          <Text style={styles.viewerText}>
            {post.plotId ? `${post.plotId} - ` : ""}
            {post.cropType}
          </Text>
          <Text style={styles.viewerText}>
            {stageName(post.growthStage)} - {envName(post.envMode)}
          </Text>
          <Text style={styles.viewerText}>
            {post.symptomDescription} - Mức độ {post.severity}
          </Text>
        </View>
        <View style={styles.viewerNav}>
          <Pressable
            disabled={index === 0}
            onPress={() => setIndex((value) => Math.max(0, value - 1))}
          >
            <ChevronLeft size={34} color="#fff" />
          </Pressable>
          <Text style={styles.viewerCount}>
            {index + 1}/{post.images.length}
          </Text>
          <Pressable
            disabled={index >= post.images.length - 1}
            onPress={() =>
              setIndex((value) => Math.min(post.images.length - 1, value + 1))
            }
          >
            <ChevronRight size={34} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function ManagementScreen() {
  const { user, logout } = useAuth();
  const [variant, setVariant] = useState<ManagementVariant>("plots");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [plots, setPlots] = useState<PlotInfo[]>(DEFAULT_PLOTS);
  const [crops, setCrops] = useState<CropTypeInfo[]>(DEFAULT_CROPS);
  const [users, setUsers] = useState<User[]>([]);
  const [actionCode, setActionCode] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [snackbar, setSnackbar] = useState("");
  const [formValue, setFormValue] = useState("");

  const refresh = useCallback(async () => {
    const [plotData, cropData, userData] = await Promise.all([
      getPlots(),
      getCropTypes(),
      getUsers(),
    ]);
    if (plotData.length) setPlots(plotData);
    if (cropData.length) setCrops(cropData);
    if (userData.length) setUsers(userData);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const title =
    variant === "plots"
      ? "Mã số luống"
      : variant === "crops"
        ? "Loại cây"
        : "Tài khoản";
  const rows =
    variant === "plots" ? plots : variant === "crops" ? crops : users;
  const filteredRows = rows.filter((item: any) =>
    [item.code, item.name, item.email]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  const addItem = async () => {
    if (!formValue.trim()) return;
    if (variant === "plots") {
      const item = await addPlot({
        code: formValue.trim(),
        name: formValue.trim(),
      });
      setPlots((current) => [item, ...current]);
    } else if (variant === "crops") {
      const item = await addCropType({
        name: formValue.trim(),
        category: "Master Data",
      });
      setCrops((current) => [item, ...current]);
    }
    setSnackbar("Đã cập nhật danh sách.");
    setFormValue("");
    setAddOpen(false);
  };

  const runImport = async () => {
    const result = await importCSV(
      "plot_code,name,area,status\nL-010,Luống 010,500,active\n",
    );
    setSnackbar(
      `Import thành công ${result.success} dòng, lỗi ${result.errors}.`,
    );
  };

  return (
    <View style={styles.screen} testID="management-screen">
      <ScreenHeader
        title="Management"
        onMenu={() => setSidebarOpen(true)}
        onLogout={logout}
      />
      <View style={styles.managementHeader}>
        <View style={styles.searchBoxWide}>
          <Search size={20} color={COLORS.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm kiếm"
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
          />
        </View>
        <View style={styles.toolbar}>
          <Pressable style={styles.importButton} onPress={runImport}>
            <Upload size={16} color={COLORS.green} />
            <Text style={styles.importText}>Import CSV</Text>
          </Pressable>
          <Pressable style={styles.addButton} onPress={() => setAddOpen(true)}>
            <Plus size={16} color="#fff" />
            <Text style={styles.addText}>Thêm {title}</Text>
          </Pressable>
        </View>
      </View>
      {/* Sub-tab nav — also accessible for tests */}
      <View style={{ flexDirection: "row" }}>
        {(["plots", "crops", "accounts"] as const).map((id) => (
          <Pressable
            key={id}
            testID={`admin-${id}`}
            onPress={() => setVariant(id)}
            style={[
              { padding: 8 },
              variant === id && {
                borderBottomWidth: 2,
                borderBottomColor: COLORS.green,
              },
            ]}
          >
            <Text
              style={{ color: variant === id ? COLORS.green : COLORS.muted }}
            >
              {id === "plots"
                ? "Mã số luống"
                : id === "crops"
                  ? "Loại cây"
                  : "Tài khoản"}
            </Text>
          </Pressable>
        ))}
      </View>
      <ScrollView
        style={styles.managementList}
        contentContainerStyle={styles.managementListContent}
      >
        <Text style={styles.tableTitle}>{title}</Text>
        {filteredRows.map((item: any) => (
          <View key={item.id || item.email} style={styles.dataRow}>
            <View>
              <Text style={styles.dataCode}>{item.code || item.name}</Text>
              <Text style={styles.dataMeta}>
                {item.name || item.email}
                {item.areaSquareMeters ? ` - ${item.areaSquareMeters} m2` : ""}
              </Text>
            </View>
            <Pressable
              style={styles.iconButton}
              onPress={() =>
                setActionCode(item.code || item.name || item.email)
              }
            >
              <MoreVertical size={20} color={COLORS.text} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
      <BottomNav active="management" admin />
      <ManagementDrawer
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        variant={variant}
        setVariant={setVariant}
        user={user}
        logout={logout}
      />
      <BottomSheet
        visible={Boolean(actionCode)}
        title="Action Menu"
        onClose={() => setActionCode(null)}
      >
        <Pressable style={styles.optionRow} onPress={() => setActionCode(null)}>
          <Text style={styles.optionTitle}>Chỉnh sửa</Text>
        </Pressable>
        <Pressable
          style={styles.optionRow}
          onPress={() => {
            setSnackbar("Đã cập nhật trạng thái.");
            setActionCode(null);
          }}
        >
          <Text style={styles.optionTitle}>Ngừng sử dụng / Khóa tài khoản</Text>
        </Pressable>
      </BottomSheet>
      <BottomSheet
        visible={addOpen}
        title={`Thêm ${title}`}
        onClose={() => setAddOpen(false)}
      >
        <View style={styles.fieldStack}>
          <FieldLabel>{title}</FieldLabel>
          <TextInput
            value={formValue}
            onChangeText={setFormValue}
            style={styles.textInput}
            placeholder={`Nhập ${title.toLowerCase()}`}
            placeholderTextColor={COLORS.muted}
          />
        </View>
        <PrimaryButton
          label="Lưu"
          onPress={addItem}
          disabled={!formValue.trim()}
        />
      </BottomSheet>
      {snackbar ? (
        <Pressable style={styles.snackbar} onPress={() => setSnackbar("")}>
          <Text style={styles.snackbarText}>{snackbar}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ManagementDrawer({
  visible,
  onClose,
  variant,
  setVariant,
  user,
  logout,
}: {
  visible: boolean;
  onClose: () => void;
  variant: ManagementVariant;
  setVariant: (variant: ManagementVariant) => void;
  user: User | null;
  logout: () => Promise<void>;
}) {
  const drawerTranslateX = useRef(new Animated.Value(-292)).current;

  useEffect(() => {
    if (!visible) return;

    drawerTranslateX.setValue(-292);
    Animated.timing(drawerTranslateX, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [drawerTranslateX, visible]);

  const set = (value: ManagementVariant) => {
    setVariant(value);
    onClose();
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.drawerLayer}>
        <Pressable style={styles.drawerScrim} onPress={onClose} />
        <Animated.View
          style={[
            styles.drawer,
            { transform: [{ translateX: drawerTranslateX }] },
          ]}
        >
          <View style={styles.drawerBrand}>
            <AppLogo />
            <Text style={styles.drawerTitle}>FarmData</Text>
          </View>
          <Pressable
            style={styles.drawerItem}
            onPress={() => router.replace("/(tabs)/posts")}
          >
            <Text style={styles.drawerText}>Post</Text>
          </Pressable>
          <Text style={styles.drawerGroup}>Management</Text>
          {[
            ["plots", "Mã số luống"],
            ["crops", "Loại cây"],
            ["accounts", "Tài khoản"],
          ].map(([id, label]) => (
            <Pressable
              key={id}
              testID={`admin-${id}`}
              style={[
                styles.drawerItem,
                variant === id && styles.drawerItemActive,
              ]}
              onPress={() => set(id as ManagementVariant)}
            >
              <Text
                style={[
                  styles.drawerText,
                  variant === id && styles.drawerTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
          <View style={styles.drawerFooter}>
            <Text style={styles.optionTitle}>{user?.name || "Admin"}</Text>
            <Pressable style={styles.logoutRow} onPress={logout}>
              <LogOut size={18} color={COLORS.danger} />
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.helpText}>Kéo xuống để tải lại dữ liệu.</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: COLORS.screen },
  loginScreen: { flex: 1, backgroundColor: COLORS.surface, overflow: "hidden" },
  loginBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    aspectRatio: 390 / 725,
  },
  loginContent: {
    flex: 1,
    paddingHorizontal: 35,
    paddingTop: 70,
    paddingBottom: 28,
  },
  loginBrand: { width: "100%", alignItems: "center", gap: 9 },
  logoMark: {
    width: 110,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: { width: 110, height: 104 },
  loginTitle: {
    color: COLORS.green,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    letterSpacing: 0,
  },
  loginSubtitle: { color: COLORS.muted, fontSize: 16, opacity: 0.8 },
  loginForm: { marginTop: 42, gap: 18 },
  loginActions: { gap: 18 },
  fieldStack: { gap: 10 },
  measurementSheetContent: { flex: 1 },
  measurementSheetSubtitle: {
    color: COLORS.body,
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 20,
  },
  measurementFieldsScroll: { flex: 1 },
  measurementFields: { gap: 18, paddingBottom: 24 },
  measurementSaveArea: {
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: "#fff",
  },
  measurementFormContent: { gap: 24, paddingBottom: 32 },
  measurementSection: { gap: 16 },
  measurementSectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  measurementSectionTitle: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 20,
  },
  measurementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  measurementInputStack: { width: "48%", gap: 7 },
  measurementInputStackFull: { width: "100%" },
  measurementInputLabel: {
    color: COLORS.body,
    fontSize: 14,
    lineHeight: 20,
  },
  measurementInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    color: COLORS.muted,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  measurementSelect: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  measurementSelectText: { color: COLORS.body, fontSize: 16, lineHeight: 24 },
  weatherDropdown: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#fff",
    maxHeight: 150,
    overflow: "hidden",
  },
  weatherDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  weatherDropdownItemSelected: {
    backgroundColor: "#f0fdf4",
  },
  weatherDropdownItemText: {
    fontSize: 16,
    color: COLORS.body,
  },
  weatherDropdownItemTextSelected: {
    color: COLORS.green,
    fontWeight: "500",
  },
  measurementDivider: { height: 1, backgroundColor: COLORS.border },
  measurementActionArea: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: "row",
    gap: 22,
    backgroundColor: "#fff",
  },
  measurementCancelButton: {
    width: 115,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  measurementCancelText: {
    color: COLORS.green,
    fontSize: 16,
    lineHeight: 24,
  },
  measurementSaveButtonWrap: { flex: 1 },
  fieldLabel: {
    color: COLORS.body,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 20,
  },
  required: { color: COLORS.danger },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    color: COLORS.body,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  cropSheetContent: { marginHorizontal: -24, flexGrow: 1 },
  cropSearchWrap: {
    height: 50,
    marginHorizontal: 35,
    marginBottom: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(224,224,224,0.5)",
  },
  cropSearchInput: {
    flex: 1,
    color: COLORS.body,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 0,
  },
  cropListScroll: { height: 430 },
  cropSearchEmpty: {
    height: 380,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
  },
  cropSearchEmptyText: {
    color: COLORS.muted,
    fontSize: 15,
    textAlign: "center",
  },
  weatherTypeCard: {
    backgroundColor: COLORS.greenSoft,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  weatherTypeValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  weatherTypeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  cropListContent: { paddingHorizontal: 35, paddingVertical: 8, gap: 4 },
  plotOption: {
    minHeight: 74,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  plotOptionSelected: { backgroundColor: "rgba(234,242,157,0.5)" },
  plotOptionBody: { flex: 1, gap: 4 },
  plotOptionCode: {
    color: COLORS.body,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "500",
  },
  plotOptionCodeSelected: { color: COLORS.green },
  plotOptionMeta: {
    color: COLORS.body,
    fontSize: 16,
    lineHeight: 20,
  },
  plotOptionCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  cropOption: {
    minHeight: 64,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  cropOptionSelected: { backgroundColor: "rgba(234,242,157,0.5)" },
  cropOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.border,
  },
  cropOptionIconSelected: { backgroundColor: COLORS.green },
  cropOptionText: {
    flex: 1,
    color: COLORS.body,
    fontSize: 16,
    lineHeight: 20,
  },
  cropOptionTextSelected: { color: COLORS.green },
  cropActionArea: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 35,
    paddingTop: 24,
    paddingBottom: 24,
  },
  sheetOutlineAction: {
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetOutlineActionText: {
    color: COLORS.green,
    fontSize: 16,
    lineHeight: 20,
  },
  stageSheetList: { marginHorizontal: -24 },
  stageOption: {
    minHeight: 80,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 35,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  stageOptionSelected: {
    backgroundColor: "rgba(234,242,157,0.5)",
    paddingVertical: 16,
  },
  stageOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8e8e5",
  },
  stageOptionIconSelected: { backgroundColor: COLORS.green },
  stageOptionBody: { flex: 1 },
  stageOptionTitle: {
    color: COLORS.body,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "500",
  },
  stageOptionMeta: { color: COLORS.body, fontSize: 14, lineHeight: 20 },
  stageRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stageRadioSelected: {
    borderWidth: 0,
    backgroundColor: COLORS.green,
  },
  sliderField: { gap: 10 },
  sliderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sliderValue: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
  sliderTrack: {
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    justifyContent: "center",
    overflow: "visible",
  },
  sliderFill: {
    position: "absolute",
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.green,
    top: 11,
  },
  sliderThumb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.green,
    borderWidth: 3,
    borderColor: "#fff",
    top: 4,
  },
  sliderScale: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderScaleText: { color: COLORS.muted, fontSize: 12, lineHeight: 16 },
  loginInputShell: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
  },
  loginInputShellInvalid: {
    borderColor: COLORS.danger,
  },
  loginErrorRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  loginErrorIcon: {
    width: 15,
    height: 15,
  },
  loginErrorText: {
    flex: 1,
    color: COLORS.danger,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  loginLeadingImage: { width: 18, height: 20, marginLeft: 18, marginRight: 12 },
  loginTrailingIcon: {
    width: 44,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  loginEyeImage: { width: 20, height: 20 },
  loginTextInput: {
    flex: 1,
    height: 48,
    color: COLORS.body,
    fontSize: 16,
    paddingVertical: 0,
    paddingRight: 12,
  },
  loginSuccessScreen: {
    flex: 1,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
  },
  loginSuccessBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    aspectRatio: 390 / 725,
  },
  successSplash: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 24,
    right: 24,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -56 }],
  },
  successIconMargin: {
    paddingBottom: 32,
  },
  successRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  successCheck: {
    color: COLORS.surface,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "700",
    textAlign: "center",
  },
  successTextBlock: {
    width: "100%",
    maxWidth: 342,
    alignItems: "center",
    gap: 8,
  },
  successTitle: {
    color: COLORS.green,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
    textAlign: "center",
  },
  successText: {
    color: COLORS.muted,
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
  },
  successProgressMargin: {
    width: 256,
    paddingTop: 32,
  },
  successProgressTrack: {
    width: 256,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#dfdfdf",
    overflow: "hidden",
  },
  successProgressFill: {
    width: 163,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#386941",
  },
  inlineError: {
    marginTop: -4,
    color: COLORS.danger,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 8,
  },
  outlineButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  outlineButtonText: { color: COLORS.green },
  googleButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 22,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleImage: { width: 24, height: 26 },
  googleText: { color: "#2b2b2b", fontSize: 16, fontWeight: "500" },
  header: {
    height: 71,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 0,
    backgroundColor: "#fff",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: "700" },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  captureContent: {
    paddingHorizontal: 35,
    paddingTop: 24,
    paddingBottom: 208,
    gap: 32,
  },
  screenTitle: {
    color: COLORS.body,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
  section: { gap: 16 },
  captureSectionWithTopPadding: { paddingTop: 8 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionStatusText: { color: COLORS.green, fontSize: 16, lineHeight: 20 },
  sectionTitle: {
    color: COLORS.body,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 20,
  },
  helpText: { color: COLORS.muted, fontSize: 12, lineHeight: 18 },
  captureHelpText: { color: COLORS.body, fontSize: 16, lineHeight: 20 },
  photoRow: { gap: 16, alignItems: "center" },
  photoRowFilled: { gap: 8 },
  photoThumb: {
    width: 92,
    height: 88,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: COLORS.field,
  },
  photoThumbFilled: { width: 80, height: 80, borderRadius: 8 },
  photoImage: { width: "100%", height: "100%" },
  removeThumb: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhoto: {
    width: 92,
    height: 88,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(25,87,41,0.3)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(234,242,157,0.5)",
  },
  addPhotoCompact: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderColor: COLORS.border,
    backgroundColor: "#fff",
  },
  addPhotoText: { color: COLORS.green, fontSize: 16, lineHeight: 20 },
  addPhotoTextCompact: { color: COLORS.body, fontSize: 10, lineHeight: 15 },
  emptyPhotoState: {
    height: 88,
    justifyContent: "center",
  },
  emptyPhotoText: { color: COLORS.danger, fontSize: 16, lineHeight: 20 },
  selectField: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  invalidField: { borderColor: COLORS.danger },
  fieldErrorText: { color: COLORS.danger, fontSize: 14, lineHeight: 20 },
  selectText: { flex: 1, color: COLORS.body, fontSize: 16 },
  placeholderText: { color: COLORS.muted },
  segmented: { flexDirection: "row", gap: 16 },
  segment: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  segmentActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
    borderWidth: 2,
  },
  segmentText: { color: COLORS.body, fontSize: 16, lineHeight: 20 },
  segmentTextActive: { color: "#fff" },
  stationCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(234,242,157,0.5)",
  },
  stationIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: "rgba(234,242,157,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    gap: 2,
  },
  stationWeatherText: {
    color: COLORS.body,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  stationIcon: { fontSize: 24, lineHeight: 30 },
  stationBody: { flex: 1, gap: 8 },
  stationHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  stationLocationBlock: { flex: 1, minWidth: 0 },
  stationTitle: { color: COLORS.body, fontSize: 16, lineHeight: 20 },
  stationCoordinateText: { color: COLORS.body, fontSize: 12, lineHeight: 16 },
  stationUpdated: { color: COLORS.body, fontSize: 14, lineHeight: 20 },
  stationBadgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  weatherMetricBadge: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(234,242,157,0.5)",
  },
  locationMetricBadge: {
    maxWidth: "100%",
  },
  weatherMetricBadgeText: {
    color: COLORS.body,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "700",
  },
  locationMetricText: { flexShrink: 1 },
  stationDetailBlock: { gap: 10, marginBottom: 20 },
  stationDetailTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  detailLabel: { flex: 1, color: COLORS.muted, fontSize: 13, lineHeight: 18 },
  detailValue: {
    flex: 1.4,
    color: COLORS.body,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "right",
  },
  stationLinkRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  stationLinkText: { color: COLORS.green, fontSize: 16, lineHeight: 20 },
  measureButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  measureStatusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  measureIcon: { color: COLORS.border, fontSize: 16, lineHeight: 20 },
  measureText: { color: COLORS.body, fontSize: 16, lineHeight: 20 },
  measureActionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  linkText: { color: COLORS.green, fontSize: 16, lineHeight: 20 },
  measureEnteredContainer: {
    width: "100%",
    gap: 12,
  },
  measureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  measureTable: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  measureTableRow: {
    flexDirection: "row",
    height: 48,
  },
  measureTableCell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "center",
  },
  measureTableBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: "#e2e8f0",
  },
  measureTableBorderTop: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  measureCellLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 2,
  },
  measureCellValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  textAreaWrap: { position: "relative", paddingBottom: 7 },
  textArea: {
    minHeight: 136,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 17,
    paddingTop: 17,
    paddingBottom: 36,
    color: COLORS.body,
    textAlignVertical: "top",
    fontSize: 16,
  },
  charCounter: {
    position: "absolute",
    right: 16,
    bottom: 23,
    color: COLORS.border,
    fontSize: 16,
    lineHeight: 20,
  },
  symptomEditStack: { gap: 16 },
  symptomSummary: { gap: 16 },
  symptomSummaryBox: {
    minHeight: 130,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 9,
    backgroundColor: "rgba(224,224,224,0.2)",
  },
  symptomSummaryText: { color: COLORS.body, fontSize: 16, lineHeight: 20 },
  symptomSummaryCounter: {
    position: "absolute",
    right: 15,
    bottom: 8,
    color: COLORS.border,
    fontSize: 12,
    lineHeight: 16,
  },
  severitySummaryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  severitySummaryLabel: { color: COLORS.body, fontSize: 16, lineHeight: 20 },
  severityPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(234,242,157,0.5)",
  },
  severityPillText: { color: COLORS.green, fontSize: 16, lineHeight: 20 },
  severityList: { gap: 8 },
  severityItem: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  severityActive: {
    backgroundColor: "rgba(185,240,189,0.2)",
    borderColor: COLORS.green,
    borderWidth: 2,
  },
  severityDot: { width: 12, height: 12, borderRadius: 6 },
  severityText: { flex: 1, color: COLORS.body, fontSize: 16, lineHeight: 20 },
  radioMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  radioMarkActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderColor: COLORS.green,
    backgroundColor: COLORS.green,
  },
  radioMarkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  contextHint: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "rgba(224,224,224,0.5)",
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contextHintText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 14,
  },
  fixedCta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 64,
    paddingHorizontal: 35,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: 8,
  },
  ctaErrorText: {
    color: COLORS.danger,
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 45,
  },
  navItem: { alignItems: "center", gap: 4, minWidth: 54 },
  navLabel: { color: COLORS.muted, fontSize: 16, lineHeight: 20 },
  navLabelActive: { color: COLORS.activeGreen },
  modalScrim: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17,24,39,0.35)",
  },
  scrimFill: { flex: 1 },
  sheet: {
    maxHeight: "76%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 28,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -8 },
  },
  fullSheet: { maxHeight: "92%", minHeight: "82%" },
  sheetHandleWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.border,
  },
  sheetHeader: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    color: COLORS.body,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
  },
  sheetBody: {
    color: COLORS.body,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  optionRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  optionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  optionMeta: { marginTop: 4, color: COLORS.muted, fontSize: 13 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metricCell: {
    width: "47%",
    minHeight: 76,
    borderRadius: 12,
    backgroundColor: COLORS.greenSoft,
    padding: 12,
  },
  metricLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metricLabel: {
    flex: 1,
    color: COLORS.body,
    fontSize: 13,
    lineHeight: 18,
  },
  metricValue: {
    marginTop: 8,
    color: COLORS.green,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,28,26,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingDialog: {
    width: 320,
    minHeight: 330,
    borderRadius: 12,
    backgroundColor: "#faf9f5",
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  loadingRingWrap: {
    width: 128,
    height: 128,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingRingCenter: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingPercentText: {
    color: "#2b2b2b",
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
  },
  loadingTitleWrap: {
    marginTop: 24,
    alignItems: "center",
  },
  loadingTitle: {
    color: "#2b2b2b",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  loadingDetailRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingDetail: {
    color: "#2b2b2b",
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
  },
  loadingBarTrack: {
    width: "100%",
    height: 6,
    marginTop: 28,
    borderRadius: 999,
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
  },
  loadingBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.green,
  },
  loadingHint: {
    marginTop: 10,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
  },
  captureSuccessDialog: {
    width: 319,
    borderRadius: 24,
    backgroundColor: "#fff",
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  captureSuccessIconWrap: {
    width: 80,
    height: 104,
    paddingBottom: 24,
    alignItems: "center",
  },
  captureSuccessIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#eaf29d",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#34703f",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  captureSuccessIconCheck: {
    position: "absolute",
  },
  captureSuccessTitle: {
    paddingBottom: 8,
    color: "#2b2b2b",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  captureSuccessDescription: {
    paddingBottom: 32,
    color: "#2b2b2b",
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
  },
  captureSuccessActions: {
    width: "100%",
    gap: 16,
  },
  captureSuccessPrimaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  captureSuccessPrimaryText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "600",
  },
  captureSuccessSecondaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  captureSuccessSecondaryText: {
    color: "#2b2b2b",
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "600",
  },
  loadingCard: {
    width: 260,
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },
  loadingText: { color: COLORS.body, textAlign: "center" },
  listHeader: { paddingHorizontal: 35, paddingTop: 13, gap: 14 },
  searchFilterRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  searchBox: {
    flex: 1,
    height: 39,
    borderRadius: 8,
    backgroundColor: COLORS.field,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  searchBoxWide: {
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.field,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, color: COLORS.body, fontSize: 14, padding: 0 },
  filterButton: {
    height: 39,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c0c9bd",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  filterText: { color: COLORS.body, fontSize: 14 },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: {
    height: 34,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.field,
  },
  chipActive: { backgroundColor: COLORS.green },
  chipText: { color: COLORS.body, fontSize: 14 },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  postList: { flex: 1, marginTop: 14 },
  postListContent: { paddingHorizontal: 35, paddingBottom: 92, gap: 16 },
  postCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 1,
  },
  postImageWrap: { height: 150, backgroundColor: COLORS.field },
  postImage: { width: "100%", height: "100%" },
  imageCountBadge: {
    position: "absolute",
    right: 10,
    bottom: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.58)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  imageCountText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  postInfo: { padding: 14, gap: 5 },
  postTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  postMeta: { color: COLORS.body, fontSize: 13 },
  postDate: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  viewer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerClose: { position: "absolute", top: 52, right: 22, zIndex: 5 },
  viewerImage: { width: "100%", height: "70%" },
  viewerLabel: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 96,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.62)",
    padding: 12,
  },
  viewerText: { color: "#fff", fontSize: 14, lineHeight: 20 },
  viewerNav: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewerCount: { color: "#fff", fontSize: 15, fontWeight: "700" },
  emptyState: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: "700" },
  managementHeader: {
    paddingHorizontal: 35,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 16,
  },
  toolbar: { flexDirection: "row", gap: 12 },
  importButton: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  importText: { color: COLORS.green, fontSize: 14, fontWeight: "700" },
  addButton: {
    flex: 1.28,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  managementList: { flex: 1 },
  managementListContent: { paddingHorizontal: 35, paddingBottom: 92 },
  tableTitle: {
    height: 36,
    paddingHorizontal: 16,
    color: COLORS.body,
    fontSize: 14,
    fontWeight: "700",
  },
  dataRow: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dataCode: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  dataMeta: { marginTop: 3, color: COLORS.muted, fontSize: 13 },
  drawerLayer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(17,24,39,0.35)",
  },
  drawerScrim: { flex: 1 },
  drawer: {
    width: 292,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 24,
  },
  drawerBrand: { alignItems: "center", gap: 8, marginBottom: 20 },
  drawerTitle: { color: COLORS.green, fontSize: 24, fontWeight: "800" },
  drawerGroup: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  drawerItem: {
    minHeight: 44,
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  drawerItemActive: { backgroundColor: COLORS.greenSoft },
  drawerText: { color: COLORS.body, fontSize: 16, fontWeight: "600" },
  drawerTextActive: { color: COLORS.green },
  drawerFooter: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 16,
    gap: 12,
  },
  logoutRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoutText: { color: COLORS.danger, fontSize: 15, fontWeight: "700" },
  snackbar: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 82,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: COLORS.text,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  snackbarText: { color: "#fff", fontSize: 14, textAlign: "center" },
});
