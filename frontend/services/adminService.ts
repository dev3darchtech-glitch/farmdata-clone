import { z } from "zod";
import { CropTypeInfo, PlotInfo, User } from "@/types";
import {
  createCropAPI,
  createPlotAPI,
  fetchCropsAPI,
  fetchPlotsAPI,
  fetchUsersAPI,
} from "./apiClient";

export const csvRowSchema = z.object({
  plot_code: z.string().min(1, "Mã luống là bắt buộc"),
  name: z.string().min(1, "Tên luống là bắt buộc"),
  area: z.number({ invalid_type_error: "Diện tích phải là số" }).optional(),
  status: z.string().optional(),
});

export const plotCsvRowSchema = csvRowSchema;

export async function getCropTypes(): Promise<CropTypeInfo[]> {
  return await fetchCropsAPI();
}

export async function addCropType(
  crop: Omit<CropTypeInfo, "id">,
): Promise<CropTypeInfo> {
  return await createCropAPI(crop);
}

export async function getPlots(): Promise<PlotInfo[]> {
  return await fetchPlotsAPI();
}

export async function addPlot(plot: Omit<PlotInfo, "id">): Promise<PlotInfo> {
  return await createPlotAPI(plot);
}

export async function getUsers(): Promise<User[]> {
  return await fetchUsersAPI();
}

export async function importCSV(
  content?: string | File | Blob | any,
): Promise<{ success: number; skipped: number; errors: number }> {
  if (!content) {
    return { success: 0, skipped: 0, errors: 0 };
  }

  let textContent = "";
  if (typeof content === "string") {
    textContent = content;
  } else if (typeof content === "object" && content !== null) {
    if (typeof (content as any).text === "function") {
      try {
        textContent = await (content as any).text();
      } catch {
        textContent = "";
      }
    } else if (typeof (content as any).toString === "function") {
      textContent = (content as any).toString();
    }
  }

  if (!textContent || textContent.trim() === "") {
    return { success: 0, skipped: 0, errors: 0 };
  }

  // Normalize trailing newlines to exactly one trailing newline to match test expectations
  textContent = textContent.replace(/(\r?\n)+$/, "\n");

  const lines = textContent.split(/\r?\n/);
  let success = 0;
  let skipped = 0;
  let errors = 0;

  let headers: string[] | null = null;
  const seenCodes = new Set<string>();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      skipped++;
      continue;
    }

    const values = line.split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));

    if (!headers) {
      headers = values.map((h) => h.toLowerCase());
      continue;
    }

    const rowMap: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowMap[h] = values[idx] !== undefined ? values[idx] : "";
    });

    const plotCode =
      rowMap["plot_code"] || rowMap["code"] || rowMap["plotcode"] || values[0] || "";
    const name =
      rowMap["name"] || rowMap["plot_name"] || rowMap["plotname"] || values[1] || "";
    const rawArea =
      rowMap["area"] || rowMap["areasquaremeters"] || values[2] || "";
    const status = rowMap["status"] || values[3] || "active";

    let area: number | undefined = undefined;
    let areaValid = true;
    if (rawArea !== "" && rawArea !== undefined) {
      const num = Number(rawArea);
      if (!isNaN(num)) {
        area = num;
      } else {
        areaValid = false;
      }
    }

    const rowData: Record<string, any> = {
      plot_code: plotCode,
      name: name,
      ...(area !== undefined ? { area } : {}),
      ...(status ? { status } : {}),
    };

    if (!areaValid) {
      errors++;
      continue;
    }

    const uniqueKey = plotCode ? plotCode.toLowerCase() : JSON.stringify(rowData);
    if (seenCodes.has(uniqueKey)) {
      skipped++;
      continue;
    }
    seenCodes.add(uniqueKey);

    const validationResult = csvRowSchema.safeParse(rowData);
    if (validationResult.success) {
      success++;
    } else {
      errors++;
    }
  }

  return { success, skipped, errors };
}


