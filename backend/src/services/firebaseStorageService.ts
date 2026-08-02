import crypto from "crypto";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { storage } from "../configs/firebase";
import { IDriveFile } from "../models/CaptureSession";
import { CaptureLocation, WeatherCondition } from "../types";
import {
  formatVietnamDateTime,
  generatePhotoLabelName,
} from "../utils/dateHelper";

let cachedWatermarkLogoDataUri: string | null | undefined;

export interface CaptureImageDescriptionInput {
  sessionId?: string;
  farmerName?: string;
  farmerEmail?: string;
  plotId?: string;
  cropType: string;
  growthStage: string;
  envMode: string;
  captureLocation?: CaptureLocation;
  stationMeasurements: WeatherCondition;
  stationMeasurementsT24?: WeatherCondition;
  stationMeasurementsT48?: WeatherCondition;
  localMeasurements?: Partial<WeatherCondition>;
  diseaseGroup?: string;
  diseaseType?: string;
  diseaseName?: string;
  symptomDescription: string;
  severity: string;
}

export function buildCaptureImageDescription(
  metadata: CaptureImageDescriptionInput,
  imageIndex?: number,
): string {
  const station = metadata.stationMeasurements;
  const t24 = metadata.stationMeasurementsT24;
  const t48 = metadata.stationMeasurementsT48;
  const local = metadata.localMeasurements;
  const loc = metadata.captureLocation;
  const lines = [
    "Metadata phiên chụp",
    metadata.sessionId ? `Mã phiên: ${metadata.sessionId}` : undefined,
    imageIndex ? `Ảnh số: ${imageIndex}` : undefined,
    metadata.farmerName ? `Người chụp: ${metadata.farmerName}` : undefined,
    metadata.farmerEmail ? `Email: ${metadata.farmerEmail}` : undefined,
    metadata.plotId ? `Mã số luống: ${metadata.plotId}` : undefined,
    `Loại cây: ${metadata.cropType}`,
    `Giai đoạn sinh trưởng: ${metadata.growthStage}`,
    `Môi trường: ${metadata.envMode}`,
    metadata.diseaseGroup
      ? `Nhóm bệnh cây: ${metadata.diseaseGroup}`
      : undefined,
    metadata.diseaseType ? `Loại bệnh cây: ${metadata.diseaseType}` : undefined,
    metadata.diseaseName ? `Tên bệnh cây: ${metadata.diseaseName}` : undefined,
    loc?.formattedAddress ? `Vị trí: ${loc.formattedAddress}` : undefined,
    loc?.latitude !== undefined ? `Vĩ độ: ${loc.latitude}` : undefined,
    loc?.longitude !== undefined ? `Kinh độ: ${loc.longitude}` : undefined,
    loc?.accuracy !== undefined
      ? `Độ chính xác GPS: ${loc.accuracy} m`
      : undefined,
    loc?.timestamp ? `Thời điểm chụp: ${loc.timestamp}` : undefined,
    `Tình trạng: ${metadata.severity}`,
    `Mô tả triệu chứng: ${metadata.symptomDescription}`,
    `Nhiệt độ trạm T0: ${formatMeasurementValue(station.temperature, "°C")}`,
    `Độ ẩm trạm T0: ${formatMeasurementValue(station.humidity, "%")}`,
    `UV/ánh sáng trạm T0: ${formatMeasurementValue(station.lightUvIndex)}`,
    `Tốc độ gió trạm T0: ${formatMeasurementValue(station.windSpeed, " km/h")}`,
    `CO2 trạm T0: ${formatMeasurementValue(station.co2Level, " ppm")}`,
    `Mã thời tiết T0: ${formatMeasurementValue(station.weatherCode)}`,
    t24 ? `--- Thời tiết 24 giờ trước (T-24) ---` : undefined,
    t24
      ? `Nhiệt độ trạm T-24: ${formatMeasurementValue(t24.temperature, "°C")}`
      : undefined,
    t24
      ? `Độ ẩm trạm T-24: ${formatMeasurementValue(t24.humidity, "%")}`
      : undefined,
    t48 ? `--- Thời tiết 48 giờ trước (T-48) ---` : undefined,
    t48
      ? `Nhiệt độ trạm T-48: ${formatMeasurementValue(t48.temperature, "°C")}`
      : undefined,
    local && local.temperature !== undefined
      ? `Nhiệt độ nhập tay: ${formatMeasurementValue(local.temperature, "°C")}`
      : undefined,
    local && local.humidity !== undefined
      ? `Độ ẩm nhập tay: ${formatMeasurementValue(local.humidity, "%")}`
      : undefined,
  ];

  return lines.filter(Boolean).join("\n");
}

function resolveWatermarkLogoPath(): string | null {
  const candidates = [
    path.resolve(__dirname, "../assets/images/logo.svg"),
    path.resolve(__dirname, "../../src/assets/images/logo.svg"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function getWatermarkLogoDataUri(): string | null {
  if (cachedWatermarkLogoDataUri !== undefined) {
    return cachedWatermarkLogoDataUri;
  }

  try {
    const logoPath = resolveWatermarkLogoPath();
    if (!logoPath) {
      cachedWatermarkLogoDataUri = null;
      return cachedWatermarkLogoDataUri;
    }

    const svg = fs.readFileSync(logoPath, "utf8");
    cachedWatermarkLogoDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    cachedWatermarkLogoDataUri = null;
  }

  return cachedWatermarkLogoDataUri;
}

export interface PostImageWatermarkInput {
  cropType: string;
  growthStage: string;
  severity: string;
  stationMeasurements: Partial<WeatherCondition>;
  symptomDescription: string;
  isRaining?: boolean;
}

function formatMeasurementValue(value: unknown, suffix = ""): string {
  return value === undefined || value === null || value === ""
    ? "Không có"
    : `${value}${suffix}`;
}

async function imageUriToBuffer(
  imageUri: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const dataUriMatch = imageUri.match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/,
  );
  if (dataUriMatch) {
    return {
      buffer: Buffer.from(dataUriMatch[2], "base64"),
      mimeType: dataUriMatch[1],
    };
  }

  const rawBase64Match =
    /^[A-Za-z0-9+/]+={0,2}$/.test(imageUri) && imageUri.length > 100;
  if (rawBase64Match) {
    return {
      buffer: Buffer.from(imageUri, "base64"),
      mimeType: "image/jpeg",
    };
  }

  if (/^https?:\/\//i.test(imageUri)) {
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Could not fetch image URL (${response.status})`);
    }
    const mimeType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType,
    };
  }

  throw new Error(
    "Image payload must be a data URI, base64 string, or HTTP URL",
  );
}

function escapeSvgText(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toAsciiWatermarkText(value: unknown): string {
  return String(value ?? "")
    .replace(/Đ/g, "D")
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "");
}

function wrapText(value: string, maxChars: number): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) {
      lines.push(current);
    }
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function formatWatermarkValue(value: unknown, suffix = ""): string {
  if (value === undefined || value === null || value === "") return "--";
  return `${value}${suffix}`;
}

const DRIZZLE_CODES = [51, 53, 55, 56, 57];
const RAIN_CODES = [61, 63, 65, 66, 67, 80, 81, 82];
const SNOW_CODES = [71, 73, 75, 77, 85, 86];
const THUNDERSTORM_CODES = [95, 96, 99];

function getWeatherCodeLabel(
  code?: number,
  isRaining?: boolean,
): string {
  if (isRaining === true) {
    return "Đang mưa";
  }

  if (code === undefined || code === null) {
    return "--";
  }

  if (code === 0) return "Trời quang";
  if (code === 1 || code === 2) return "Có mây";
  if (code === 3) return "Nhiều mây";
  if (code === 45 || code === 48) return "Sương mù";

  if (DRIZZLE_CODES.includes(code)) {
    return "Mô hình ghi nhận mưa phùn quanh khu vực";
  }

  if (RAIN_CODES.includes(code)) {
    return "Mô hình ghi nhận mưa quanh khu vực";
  }

  if (SNOW_CODES.includes(code)) {
    return "Tuyết";
  }

  if (THUNDERSTORM_CODES.includes(code)) {
    return "Mô hình ghi nhận giông quanh khu vực";
  }

  return "Không xác định";
}

function renderSvgTextLines({
  lines,
  x,
  y,
  lineHeight,
  fontSize,
  fontWeight = 500,
  fill = "#ffffff",
}: {
  fill?: string;
  fontSize: number;
  fontWeight?: number;
  lineHeight: number;
  lines: string[];
  x: number;
  y: number;
}): string {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}">${escapeSvgText(toAsciiWatermarkText(line))}</text>`,
    )
    .join("");
}

function buildPostWatermarkSvg(
  width: number,
  height: number,
  metadata: PostImageWatermarkInput,
): string {
  const bottomHeight = Math.max(142, Math.round(height * 0.2));
  const bottomY = height - bottomHeight;
  const horizontalPadding = Math.max(28, Math.round(width * 0.035));
  const titleFont = Math.max(28, Math.round(width * 0.026));
  const bodyFont = Math.max(18, Math.round(width * 0.017));
  const bodyLineHeight = Math.round(bodyFont * 1.45);
  const maxBottomChars = Math.max(34, Math.round(width / (bodyFont * 0.58)));
  const diseaseLines = wrapText(
    `Tình trạng bệnh: ${metadata.severity} - ${metadata.symptomDescription}`,
    maxBottomChars,
  ).slice(0, 2);
  const bottomLines = [
    `Loại cây: ${metadata.cropType}`,
    ...diseaseLines,
    `Giai đoạn sinh trưởng: ${metadata.growthStage}`,
  ];

  const station = metadata.stationMeasurements || {};
  const metricLines = [
    `Thời tiết: ${getWeatherCodeLabel(
      station.weatherCode,
      metadata.isRaining ?? station.isRaining,
    )}`,
    `Nhiệt độ: ${formatWatermarkValue(station.temperature, "°C")}`,
    `Độ ẩm: ${formatWatermarkValue(station.humidity, "%")}`,
    `Ánh sáng: ${formatWatermarkValue(station.lightUvIndex)}`,
    `Gió: ${formatWatermarkValue(station.windSpeed, " km/h")}`,
    `CO2: ${formatWatermarkValue(station.co2Level, " ppm")}`,
  ];
  const metricFont = Math.max(16, Math.round(width * 0.014));
  const metricLineHeight = Math.round(metricFont * 1.38);
  const metricBoxWidth = Math.min(
    Math.max(270, Math.round(width * 0.32)),
    width - horizontalPadding * 2,
  );
  const metricBoxHeight = metricLines.length * metricLineHeight + 34;
  const metricX = width - horizontalPadding - metricBoxWidth;
  const metricY = horizontalPadding;
  const logoDataUri = getWatermarkLogoDataUri();
  const logoWidth = Math.max(72, Math.round(width * 0.09));
  const logoHeight = Math.round((logoWidth * 104) / 110);
  const logoPadding = 10;
  const logoBoxWidth = logoWidth + logoPadding * 2;
  const logoBoxHeight = logoHeight + logoPadding * 2;
  const logoX = width - horizontalPadding - logoBoxWidth;
  const logoY = metricY;
  const metricYOffset = logoBoxHeight + 12;
  const metricContainerY = metricY + metricYOffset;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        text { font-family: "DejaVu Sans", sans-serif; }
      </style>
      <rect x="0" y="${bottomY}" width="${width}" height="${bottomHeight}" fill="#0c1210" fill-opacity="0.72" />
      ${
        logoDataUri
          ? `<rect x="${logoX}" y="${logoY}" width="${logoBoxWidth}" height="${logoBoxHeight}" rx="18" fill="#0c1210" fill-opacity="0.68" />
      <image x="${logoX + logoPadding}" y="${logoY + logoPadding}" width="${logoWidth}" height="${logoHeight}" href="${logoDataUri}" preserveAspectRatio="xMidYMid meet" />`
          : ""
      }
      <rect x="${metricX}" y="${metricContainerY}" width="${metricBoxWidth}" height="${metricBoxHeight}" rx="18" fill="#0c1210" fill-opacity="0.68" />
      ${renderSvgTextLines({
        lines: [bottomLines[0]],
        x: horizontalPadding,
        y: bottomY + 46,
        lineHeight: titleFont + 8,
        fontSize: titleFont,
        fontWeight: 700,
      })}
      ${renderSvgTextLines({
        lines: bottomLines.slice(1),
        x: horizontalPadding,
        y: bottomY + 46 + titleFont + 16,
        lineHeight: bodyLineHeight,
        fontSize: bodyFont,
      })}
      ${renderSvgTextLines({
        lines: metricLines,
        x: metricX + 20,
        y: metricContainerY + metricLineHeight + 10,
        lineHeight: metricLineHeight,
        fontSize: metricFont,
        fontWeight: 600,
      })}
    </svg>
  `;
}

async function applyPostImageWatermark(
  image: { buffer: Buffer; mimeType: string },
  watermark: PostImageWatermarkInput,
  outputFormat: "jpeg" | "png" | "webp",
): Promise<{ buffer: Buffer; mimeType: string }> {
  const metadata = await sharp(image.buffer).metadata();
  const width = metadata.width || 1200;
  const height = metadata.height || 900;
  const overlay = Buffer.from(buildPostWatermarkSvg(width, height, watermark));
  const markedImage = sharp(image.buffer)
    .rotate()
    .composite([{ input: overlay, gravity: "center" }]);
  const buffer =
    outputFormat === "png"
      ? await markedImage.png().toBuffer()
      : outputFormat === "webp"
        ? await markedImage.webp({ quality: 90 }).toBuffer()
        : await markedImage.jpeg({ quality: 90, mozjpeg: true }).toBuffer();

  return {
    buffer,
    mimeType: image.mimeType,
  };
}

async function addMarkOverlay(
  imageBuffer: Buffer,
  metadata: {
    adminEmail?: string;
    plotId?: string;
    cropType?: string;
    diseaseName?: string;
    envMode?: string;
    weatherCode?: number;
    temperature?: number;
    isRaining?: boolean;
    captureLocation?: {
      latitude?: number;
      longitude?: number;
      name?: string;
      formattedAddress?: string;
      city?: string;
      region?: string;
      country?: string;
    };
  },
  outputFormat: "jpeg" | "png" | "webp" = "jpeg",
): Promise<Buffer> {
  try {
    const sharpImg = sharp(imageBuffer);
    const imgMetadata = await sharpImg.metadata();
    const width = imgMetadata.width || 800;
    const height = imgMetadata.height || 600;

    const dateStr = formatVietnamDateTime(new Date()).slice(0, 16);

    const email = metadata.adminEmail || "admin@farmdata.com";
    const plot = metadata.plotId || "N/A";
    const crop = metadata.cropType || "N/A";
    const disease = metadata.diseaseName || "N/A";

    const lat = metadata.captureLocation?.latitude;
    const lng = metadata.captureLocation?.longitude;
    const addr =
      metadata.captureLocation?.formattedAddress ||
      metadata.captureLocation?.name;
    const city = metadata.captureLocation?.city;
    const region = metadata.captureLocation?.region;
    const locationPart = addr
      ? addr
      : city || region
        ? [region, city].filter(Boolean).join(", ")
        : lat !== undefined && lng !== undefined
          ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          : "N/A";
    const locationStr = `${locationPart}`;

    const leftLines = [
      `FARMDATA`,
      `Luong ${plot}`,
      `Cay ${crop}`,
      `Benh ${disease}`,
      locationStr,
    ].map(toAsciiWatermarkText);

    const gpsStr =
      lat !== undefined && lng !== undefined
        ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        : "N/A";

    const envLower = (metadata.envMode || "").toLowerCase();
    const envStr =
      envLower.includes("greenhouse") || envLower.includes("kinh")
        ? "Nha kinh"
        : "Ngoai troi";

    const tempStr =
      metadata.temperature !== undefined ? `${metadata.temperature}°C` : "--°C";
    const weatherLabel = getWeatherCodeLabel(
      metadata.weatherCode,
      metadata.isRaining,
    );
    const weatherStr = `${weatherLabel} (${tempStr})`;

    const rightLines = [
      envStr,
      weatherStr,
      gpsStr,
      `${email}`,
      `${dateStr}`,
    ].map(toAsciiWatermarkText);

    const padding = 10;
    const lineHeight = Math.max(12, Math.round(height * 0.028));
    const maxLines = Math.max(leftLines.length, rightLines.length);
    const barHeight = maxLines * lineHeight + padding * 2;
    const fontSize = Math.max(9, Math.round(lineHeight * 0.68));

    const leftTextElements = leftLines
      .map((line, idx) => {
        const yPos = height - barHeight + padding + idx * lineHeight + fontSize;
        return `<text x="16" y="${yPos}" class="watermark-text" text-anchor="start">${escapeSvgText(line)}</text>`;
      })
      .join("\n");

    const rightTextElements = rightLines
      .map((line, idx) => {
        const yPos = height - barHeight + padding + idx * lineHeight + fontSize;
        return `<text x="${width - 16}" y="${yPos}" class="watermark-text" text-anchor="end">${escapeSvgText(line)}</text>`;
      })
      .join("\n");

    const svgText = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .watermark-bar {
            fill: rgba(0, 0, 0, 0.75);
          }
          .watermark-text {
            fill: #ffffff;
            font-size: ${fontSize}px;
            font-family: "DejaVu Sans", sans-serif;
            font-weight: bold;
          }
        </style>
        <rect x="0" y="${height - barHeight}" width="${width}" height="${barHeight}" class="watermark-bar" />
        ${leftTextElements}
        ${rightTextElements}
      </svg>
    `;

    const logoPath = path.resolve(
      __dirname,
      "../../../frontend/assets/images/logo.svg",
    );
    let logoBuffer: Buffer | null = null;
    try {
      if (fs.existsSync(logoPath)) {
        logoBuffer = fs.readFileSync(logoPath);
      }
    } catch (logoErr) {
      console.warn("Failed to read logo.svg file:", logoErr);
    }

    const compositeList: any[] = [
      {
        input: Buffer.from(svgText),
        top: 0,
        left: 0,
      },
    ];

    if (logoBuffer) {
      const logoResized = await sharp(logoBuffer)
        .resize({ width: Math.max(40, Math.round(width * 0.065)) })
        .toBuffer();
      compositeList.push({
        input: logoResized,
        top: 16,
        left: width - Math.max(40, Math.round(width * 0.065)) - 16,
      });
    }

    const markedImage = sharpImg.composite(compositeList);
    if (outputFormat === "png") return markedImage.png().toBuffer();
    if (outputFormat === "webp")
      return markedImage.webp({ quality: 90 }).toBuffer();
    return markedImage.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  } catch (err) {
    console.warn(
      "Failed to create mark overlay, returning original buffer:",
      err,
    );
    return imageBuffer;
  }
}

async function normalizeImageForFirebase(image: {
  buffer: Buffer;
  mimeType: string;
}): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
  const metadata = await sharp(image.buffer).metadata();
  const format = metadata.format;

  if (format === "jpeg" || (format as string) === "jpg") {
    return {
      buffer: await sharp(image.buffer)
        .rotate()
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer(),
      mimeType: "image/jpeg",
      extension: "jpg",
    };
  }
  if (format === "png") {
    return {
      buffer: await sharp(image.buffer).rotate().png().toBuffer(),
      mimeType: "image/png",
      extension: "png",
    };
  }
  if (format === "webp") {
    return {
      buffer: await sharp(image.buffer)
        .rotate()
        .webp({ quality: 90 })
        .toBuffer(),
      mimeType: "image/webp",
      extension: "webp",
    };
  }

  return {
    buffer: await sharp(image.buffer)
      .rotate()
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer(),
    mimeType: "image/jpeg",
    extension: "jpg",
  };
}

export interface StorageUploadOptions {
  farmerEmailOrId: string;
  imageUris: string[];
  plotId?: string;
  cropType?: string;
  envMode?: string;
  growthStage?: string;
  diseaseName?: string;
  severity?: string;
  description?: string | ((imageIndex: number) => string);
  destination?: "capture" | "post";
  watermark?: PostImageWatermarkInput;
  adminEmail?: string;
  captureLocation?: {
    latitude?: number;
    longitude?: number;
    name?: string;
    formattedAddress?: string;
    city?: string;
    region?: string;
    country?: string;
  };
  weatherCode?: number;
  temperature?: number;
  isRaining?: boolean;
}

/**
 * Upload images directly to Firebase Storage.
 */
export async function uploadImagesToFirebaseStorage(
  options: StorageUploadOptions,
): Promise<IDriveFile[]> {
  const {
    imageUris,
    plotId,
    cropType = "Crop",
    envMode = "outdoor",
    growthStage = "Stage",
    diseaseName,
    description,
    destination = "capture",
    watermark,
  } = options;

  const uploadedFiles: IDriveFile[] = [];
  const bucket = storage.bucket();

  for (let i = 0; i < imageUris.length; i++) {
    const rawImage = await imageUriToBuffer(imageUris[i]);
    const normalizedImage = await normalizeImageForFirebase(rawImage);
    const outputFormat =
      normalizedImage.extension === "png"
        ? "png"
        : normalizedImage.extension === "webp"
          ? "webp"
          : "jpeg";

    const labelName = generatePhotoLabelName(
      plotId,
      cropType,
      envMode,
      growthStage,
      diseaseName,
      i + 1,
      undefined,
      normalizedImage.extension,
    );
    const fileDescription =
      typeof description === "function" ? description(i + 1) : description;

    const folderPath = destination === "post" ? "posts" : "captures";
    const storagePath = `${folderPath}/${labelName}`;
    const fileRef = bucket.file(storagePath);

    const downloadToken = crypto.randomUUID();
    await fileRef.save(normalizedImage.buffer, {
      metadata: {
        contentType: normalizedImage.mimeType,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    const webViewLink = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${downloadToken}`;
    const webContentLink = webViewLink;

    const fileMeta: IDriveFile = {
      fileId: storagePath,
      webViewLink,
      webContentLink,
      fileName: labelName,
      folderPath,
      description: fileDescription,
    };

    uploadedFiles.push(fileMeta);

    try {
      const markedBuffer =
        watermark && destination === "post"
          ? (
              await applyPostImageWatermark(
                normalizedImage,
                watermark,
                outputFormat,
              )
            ).buffer
          : await addMarkOverlay(
              normalizedImage.buffer,
              {
                adminEmail: options.adminEmail,
                plotId,
                cropType,
                diseaseName,
                envMode,
                captureLocation: options.captureLocation,
                weatherCode: options.weatherCode,
                temperature: options.temperature,
                isRaining: options.isRaining,
              },
              outputFormat,
            );

      const baseName = labelName.substring(0, labelName.lastIndexOf("."));
      const extension = labelName.substring(labelName.lastIndexOf("."));
      const markLabelName = `${baseName}_MARK${extension}`;
      const markStoragePath = `${folderPath}/${markLabelName}`;
      const markFileRef = bucket.file(markStoragePath);

      const markDownloadToken = crypto.randomUUID();
      await markFileRef.save(markedBuffer, {
        metadata: {
          contentType: normalizedImage.mimeType,
          metadata: {
            firebaseStorageDownloadTokens: markDownloadToken,
          },
        },
      });

      const watermarkWebViewLink = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(markStoragePath)}?alt=media&token=${markDownloadToken}`;
      const watermarkWebContentLink = watermarkWebViewLink;

      uploadedFiles[uploadedFiles.length - 1] = {
        ...uploadedFiles[uploadedFiles.length - 1],
        watermarkFileId: markStoragePath,
        watermarkWebViewLink,
        watermarkWebContentLink,
      };
    } catch (err: any) {
      console.error("Watermark generation skipped:", err.message);
    }
  }

  return uploadedFiles;
}

/**
 * Delete images from Firebase Storage.
 */
export async function deleteFilesFromFirebaseStorage(
  storageFiles?: IDriveFile[],
): Promise<void> {
  if (!storageFiles?.length) return;
  const bucket = storage.bucket();

  for (const file of storageFiles) {
    if (file.fileId) {
      try {
        await bucket.file(file.fileId).delete();
      } catch (err: any) {
        console.warn(
          `Failed to delete Firebase Storage file ${file.fileId}:`,
          err.message,
        );
      }
    }
    if (file.watermarkFileId) {
      try {
        await bucket.file(file.watermarkFileId).delete();
      } catch (err: any) {
        console.warn(
          `Failed to delete Firebase Storage watermark ${file.watermarkFileId}:`,
          err.message,
        );
      }
    }
  }
}
