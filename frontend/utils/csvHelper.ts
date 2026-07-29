import { ManagementVariant } from "@/types/ui";
import * as DocumentPicker from "expo-document-picker";

export interface ParsedCsv {
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
}

export interface SystemFieldDefinition {
  key: string;
  label: string;
  required: boolean;
  aliases: string[];
}

export const SYSTEM_FIELDS_BY_VARIANT: Record<
  ManagementVariant,
  SystemFieldDefinition[]
> = {
  plots: [
    {
      key: "code",
      label: "Mã luống",
      required: true,
      aliases: [
        "code",
        "mã",
        "maluong",
        "mã luống",
        "plot_code",
        "id",
        "mã số",
        "thửa",
      ],
    },
    {
      key: "name",
      label: "Tên luống",
      required: true,
      aliases: [
        "name",
        "tên",
        "tenluong",
        "tên luống",
        "label",
        "plot_name",
      ],
    },
    {
      key: "areaSquareMeters",
      label: "Diện tích (m²)",
      required: false,
      aliases: [
        "area",
        "diệntích",
        "dientich",
        "diện tích",
        "m2",
        "m²",
        "area_sqm",
        "square_meters",
      ],
    },
    {
      key: "description",
      label: "Ghi chú / Mô tả",
      required: false,
      aliases: [
        "description",
        "mô tả",
        "mota",
        "ghi chú",
        "ghichu",
        "note",
        "notes",
      ],
    },
  ],
  crops: [
    {
      key: "name",
      label: "Tên loại cây",
      required: true,
      aliases: [
        "name",
        "tên",
        "tên cây",
        "tencay",
        "loại cây",
        "loaicay",
        "crop",
        "cây trồng",
      ],
    },
    {
      key: "category",
      label: "Phân loại / Nhóm",
      required: true,
      aliases: [
        "category",
        "phân loại",
        "phanloai",
        "nhóm",
        "nhom",
        "danh mục",
        "type",
      ],
    },
    {
      key: "description",
      label: "Ghi chú / Mô tả",
      required: false,
      aliases: [
        "description",
        "mô tả",
        "mota",
        "ghi chú",
        "ghichu",
        "note",
      ],
    },
  ],
  diseases: [
    {
      key: "name",
      label: "Tên bệnh cây",
      required: true,
      aliases: [
        "name",
        "tên",
        "tên bệnh",
        "tenbenh",
        "bệnh",
        "disease_name",
        "disease",
      ],
    },
    {
      key: "group",
      label: "Nhóm bệnh",
      required: true,
      aliases: [
        "group",
        "nhóm",
        "nhóm bệnh",
        "nhombenh",
        "phân nhóm",
        "disease_group",
      ],
    },
    {
      key: "type",
      label: "Loại bệnh",
      required: true,
      aliases: [
        "type",
        "loại",
        "loại bệnh",
        "loaibenh",
        "disease_type",
      ],
    },
    {
      key: "description",
      label: "Ghi chú / Mô tả",
      required: false,
      aliases: [
        "description",
        "mô tả",
        "mota",
        "ghi chú",
        "ghichu",
        "note",
      ],
    },
  ],
  accounts: [
    {
      key: "name",
      label: "Họ và tên",
      required: true,
      aliases: [
        "name",
        "tên",
        "họ tên",
        "hoten",
        "full_name",
        "farmer",
        "họ và tên",
      ],
    },
    {
      key: "username",
      label: "Tên đăng nhập / Username",
      required: true,
      aliases: [
        "username",
        "tên đăng nhập",
        "tendangnhap",
        "user",
        "login",
        "tài khoản",
      ],
    },
  ],
};

/**
 * Robust CSV parser supporting quotes, commas, semicolons, and newlines
 */
export function parseCsvContent(
  content: string,
  fileName = "data.csv",
): ParsedCsv {
  const cleanText = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleanText.split("\n").filter((l) => l.trim().length > 0);
  if (!lines.length) {
    return { fileName, headers: [], rows: [] };
  }

  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ";" : ",";

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(cur.trim().replace(/^"|"$/g, ""));
        cur = "";
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^"|"$/g, ""));
    return result;
  };

  const rawHeaders = parseLine(lines[0]);
  const headers = rawHeaders.map((h, i) => h || `Cột ${i + 1}`);

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.every((v) => !v)) continue;
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || "";
    });
    rows.push(rowObj);
  }

  return { fileName, headers, rows };
}

/**
 * Smart auto-matcher for mapping CSV headers to system fields
 */
export function autoMatchFields(
  headers: string[],
  variant: ManagementVariant,
): Record<string, string> {
  const fields = SYSTEM_FIELDS_BY_VARIANT[variant] || [];
  const mapping: Record<string, string> = {};

  fields.forEach((field) => {
    const matchedHeader = headers.find((h) => {
      const normH = h
        .toLowerCase()
        .replace(
          /[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/g,
          "",
        );
      return field.aliases.some((alias) => {
        const normA = alias
          .toLowerCase()
          .replace(
            /[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/g,
            "",
          );
        return normH === normA || normH.includes(normA) || normA.includes(normH);
      });
    });
    mapping[field.key] = matchedHeader || "";
  });

  return mapping;
}

export function isCsvFileName(fileName: string): boolean {
  return fileName.toLowerCase().trim().endsWith(".csv");
}

export function validateCsvContent(content: string): {
  isValid: boolean;
  error?: string;
} {
  if (!content || !content.trim()) {
    return { isValid: false, error: "File CSV không có nội dung (file rỗng)." };
  }

  const trimmed = content.trim();

  if (
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<HTML")
  ) {
    return {
      isValid: false,
      error: "File được chọn là định dạng trang web HTML, không phải file CSV.",
    };
  }

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    return {
      isValid: false,
      error: "File được chọn có cấu trúc JSON, không phải file CSV.",
    };
  }

  const cleanText = trimmed.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleanText.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return {
      isValid: false,
      error: "File CSV phải chứa ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu.",
    };
  }

  return { isValid: true };
}

export async function pickCsvFile(): Promise<{
  content: string;
  name: string;
} | null> {
  try {
    if (
      typeof window !== "undefined" &&
      typeof document !== "undefined" &&
      document.createElement
    ) {
      return new Promise((resolve, reject) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".csv,text/csv,application/csv";
        input.style.display = "none";

        input.onchange = async (e: any) => {
          const file = e.target?.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          const name = file.name || "data.csv";
          if (!isCsvFileName(name)) {
            reject(
              new Error(
                "Định dạng file không hợp lệ. Hệ thống chỉ hỗ trợ import file đuôi .csv",
              ),
            );
            return;
          }
          const content = await file.text();
          const validation = validateCsvContent(content);
          if (!validation.isValid) {
            reject(new Error(validation.error || "File CSV không hợp lệ."));
            return;
          }
          resolve({ content, name });
        };

        document.body.appendChild(input);
        input.click();
        setTimeout(() => {
          document.body.removeChild(input);
        }, 1000);
      });
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: [
        ".csv",
        "text/csv",
        "application/csv",
        "text/comma-separated-values",
        "application/vnd.ms-excel",
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];
    const name = asset.name || "data.csv";

    if (!isCsvFileName(name)) {
      throw new Error(
        "Định dạng file không hợp lệ. Hệ thống chỉ hỗ trợ import file đuôi .csv",
      );
    }

    const response = await fetch(asset.uri);
    const content = await response.text();

    const validation = validateCsvContent(content);
    if (!validation.isValid) {
      throw new Error(validation.error || "File CSV không hợp lệ.");
    }

    return { content, name };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    console.error("pickCsvFile error:", error);
    return null;
  }
}
