import { SYMPTOM_SEVERITY_VALUES } from "@/types";
import { z } from "zod";

/**
 * Login Form Validation Schema
 */
export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên đăng nhập hoặc email")
    .refine((value) => {
      const isEmail = z.string().email().safeParse(value).success;
      const isUsername = /^[a-zA-Z0-9_]+$/.test(value);
      return isEmail || isUsername;
    }, "Tên đăng nhập hoặc email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

/**
 * Capture Session Form Validation Schema
 */
export const captureSessionFormSchema = z
  .object({
    images: z
      .array(z.string())
      .min(1, "Vui lòng chụp ít nhất 1 ảnh của cây trồng"),
    plotId: z.string().optional(),
    cropType: z.string().min(1, "Vui lòng chọn loại cây trồng"),
    customCrop: z.string().optional(),
    growthStage: z.enum(
      ["newly_planted", "vegetative", "flowering", "fruiting", "harvest"],
      { message: "Vui lòng chọn giai đoạn sinh trưởng" },
    ),
    envMode: z.enum(["outdoor", "greenhouse"], {
      message: "Vui lòng chọn loại môi trường canh tác",
    }),
    hasLocalMeasurement: z.boolean().default(false),
    localTemp: z.string().optional(),
    localHumidity: z.string().optional(),
    localWindSpeed: z.string().optional(),
    localCo2: z.string().optional(),
    localSoilDo: z.string().optional(),
    localSoilHumidity: z.string().optional(),
    symptomDescription: z.string().optional(),
    severity: z.enum(SYMPTOM_SEVERITY_VALUES, {
      message: "Vui lòng chọn mức độ triệu chứng",
    }),
  })
  .refine(
    (data) => {
      if (data.cropType === "Khác") {
        return Boolean(data.customCrop && data.customCrop.trim().length > 0);
      }
      return true;
    },
    {
      message: "Vui lòng nhập tên loại cây trồng khác",
      path: ["customCrop"],
    },
  )
  .refine(
    (data) => {
      return Boolean(
        data.symptomDescription && data.symptomDescription.trim().length > 0,
      );
    },
    {
      message: "Vui lòng nhập mô tả triệu chứng quan sát được",
      path: ["symptomDescription"],
    },
  );

export type CaptureSessionFormValues = z.infer<typeof captureSessionFormSchema>;

/**
 * Plot Form Validation Schema
 */
export const plotFormSchema = z.object({
  code: z.string().min(1, "Mã số luống là bắt buộc"),
  name: z.string().trim().min(1, "Tên lô / luống là bắt buộc"),
  areaSquareMeters: z
    .number({ invalid_type_error: "Diện tích phải là số" })
    .optional(),
});

export type PlotFormValues = z.infer<typeof plotFormSchema>;

/**
 * Crop Form Validation Schema
 */
export const cropFormSchema = z.object({
  name: z.string().min(1, "Tên loại cây là bắt buộc"),
  category: z.string().min(1, "Nhóm cây trồng là bắt buộc"),
  icon: z.string().optional(),
});

export type CropFormValues = z.infer<typeof cropFormSchema>;

/**
 * User Form Validation Schema (Admin account creation)
 */
export const userFormSchema = z.object({
  name: z.string().min(1, "Họ và tên là bắt buộc"),
  email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  role: z.enum(["FARMER", "ADMIN"], {
    message: "Vui lòng chọn vai trò",
  }),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
