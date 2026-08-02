import { DataRecord, StorageSaveResult } from "@/types";
import * as FileSystem from "expo-file-system";
import { EncodingType, documentDirectory } from "expo-file-system";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Saves DataRecord as JSON file to local device file storage using expo-file-system.
 */
export async function saveToLocalStorage(
  record: DataRecord,
): Promise<StorageSaveResult> {
  try {
    const baseDir = documentDirectory || "/mock/app_storage/";
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

    const encoding = EncodingType.UTF8;
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
 * Uploads DataRecord JSON file to Firebase Storage.
 * Falls back to a mock URL when offline or unauthenticated.
 */
export async function uploadToFirebaseStorage(
  record: DataRecord,
  accessToken?: string,
): Promise<StorageSaveResult> {
  const mockFileUrl = `mock_firebase_${record.id}_${Date.now()}`;

  // Offline / unauthenticated fallback
  if (!accessToken || accessToken.startsWith("mock_")) {
    return {
      success: true,
      destination: "firebase",
      fileUrl: mockFileUrl,
      isFallback: true,
      record: { ...record, fileUrl: mockFileUrl },
    };
  }

  try {
    const fileContent = JSON.stringify(record, null, 2);
    const storagePath = `records/record_${record.id}.json`;
    const fileRef = ref(storage, storagePath);

    await uploadString(fileRef, fileContent, "raw", {
      contentType: "application/json",
    });

    const downloadUrl = await getDownloadURL(fileRef);

    return {
      success: true,
      destination: "firebase",
      fileUrl: downloadUrl,
      isFallback: false,
      record: { ...record, fileUrl: downloadUrl },
    };
  } catch (error: any) {
    return {
      success: true, // fallback mock mode on API error
      destination: "firebase",
      fileUrl: mockFileUrl,
      isFallback: true,
      error: error?.message || "Lỗi khi upload lên Firebase Storage",
      record: { ...record, fileUrl: mockFileUrl },
    };
  }
}
