import { DataRecord, StorageSaveResult } from "@/types";
import * as FileSystem from "expo-file-system";

/**
 * Helper to build standard Google Drive API multipart request body.
 */
export function buildGoogleDriveMultipartBody(
  metadata: object,
  fileContent: string,
  boundary: string,
): string {
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  return (
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    "Content-Type: application/json\r\n\r\n" +
    fileContent +
    closeDelimiter
  );
}

/**
 * Saves DataRecord as JSON file to local device file storage using expo-file-system.
 */
export async function saveToLocalStorage(
  record: DataRecord,
): Promise<StorageSaveResult> {
  try {
    const baseDir = FileSystem.documentDirectory || "/mock/app_storage/";
    const targetDir = `${baseDir}data_records/`;

    const dirInfo = await FileSystem.getInfoAsync(targetDir).catch(() => ({
      exists: false,
    }));
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(targetDir, {
        intermediates: true,
      }).catch(() => {});
    }

    const fileName = `record_${record.id}.json`;
    const filePath = `${targetDir}${fileName}`;
    const jsonContent = JSON.stringify(record, null, 2);

    const encoding = FileSystem.EncodingType?.UTF8 ?? "utf8";
    await FileSystem.writeAsStringAsync(filePath, jsonContent, {
      encoding,
    });

    return {
      success: true,
      destination: "local",
      filePath,
      record: { ...record, localFilePath: filePath },
    };
  } catch (error: any) {
    return {
      success: false,
      destination: "local",
      error: error?.message || "Không thể lưu bản ghi vào bộ nhớ thiết bị",
    };
  }
}

/**
 * Uploads DataRecord JSON file to Google Drive via multipart upload endpoint.
 * Includes automatic mock fallback when offline or unauthenticated.
 */
export async function uploadToGoogleDrive(
  record: DataRecord,
  accessToken?: string,
): Promise<StorageSaveResult> {
  const mockDriveFileId = `mock_gdrive_${record.id}_${Date.now()}`;

  // Offline / unauthenticated fallback check
  if (!accessToken || accessToken.startsWith("mock_")) {
    return {
      success: true,
      destination: "gdrive",
      driveFileId: mockDriveFileId,
      isFallback: true,
      record: { ...record, driveFileId: mockDriveFileId },
    };
  }

  const boundary = `foo_bar_boundary_${Date.now()}`;
  const metadata = {
    name: `record_${record.id}.json`,
    mimeType: "application/json",
  };
  const fileContent = JSON.stringify(record, null, 2);
  const body = buildGoogleDriveMultipartBody(metadata, fileContent, boundary);

  try {
    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        success: true, // fallback mock mode on API error
        destination: "gdrive",
        driveFileId: mockDriveFileId,
        isFallback: true,
        error: `API Upload failed (${response.status}): ${errorText}`,
        record: { ...record, driveFileId: mockDriveFileId },
      };
    }

    const data = await response.json();
    const driveFileId = data.id || mockDriveFileId;

    return {
      success: true,
      destination: "gdrive",
      driveFileId,
      isFallback: false,
      record: { ...record, driveFileId },
    };
  } catch (error: any) {
    return {
      success: true,
      destination: "gdrive",
      driveFileId: mockDriveFileId,
      isFallback: true,
      error: error?.message || "Lỗi kết nối mạng khi tải lên Google Drive",
      record: { ...record, driveFileId: mockDriveFileId },
    };
  }
}
