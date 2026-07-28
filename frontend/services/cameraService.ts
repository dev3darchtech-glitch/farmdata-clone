import { LocationData } from "@/types";
import { Camera, CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { generateIsoTimestamp, getCurrentLocation } from "./locationService";

export interface CameraCaptureMetadataResult {
  uri: string;
  location: LocationData;
  timestamp: string;
}

function toImageDataUri(
  base64?: string | null,
  mimeType?: string | null,
): string | undefined {
  if (!base64) return undefined;
  const normalizedMimeType = mimeType?.startsWith("image/")
    ? mimeType
    : "image/jpeg";
  return `data:${normalizedMimeType};base64,${base64}`;
}

async function requestDeviceCameraPermission(): Promise<void> {
  const permission = await Camera.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new Error("Vui lòng cấp quyền máy ảnh để chụp ảnh cây trồng.");
  }
}

/**
 * Captures image URI using camera view ref or image picker fallback.
 * Interface contract matching PROJECT.md.
 */
export async function captureCropImage(
  cameraRef?: React.RefObject<CameraView | null>,
): Promise<string> {
  await requestDeviceCameraPermission();

  try {
    if (cameraRef && cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      if (photo && photo.uri) {
        return (
          toImageDataUri(
            photo.base64,
            (photo as typeof photo & { mimeType?: string }).mimeType,
          ) || photo.uri
        );
      }
    }
  } catch {
    // Fall back to ImagePicker if cameraRef fails or unsupported
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    allowsEditing: true,
    base64: true,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    return (
      toImageDataUri(result.assets[0].base64, result.assets[0].mimeType) ||
      result.assets[0].uri
    );
  }

  throw new Error("Image capture canceled");
}

export async function pickCropImagesFromLibrary(): Promise<string[]> {
  let result: ImagePicker.ImagePickerResult;
  try {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
      allowsMultipleSelection: true,
      base64: true,
    });
  } catch (error: any) {
    throw new Error(
      error?.message ||
        "Không thể mở thư viện ảnh. Vui lòng kiểm tra quyền ảnh của ứng dụng.",
    );
  }

  if (result.canceled || !result.assets?.length) {
    return [];
  }

  return result.assets
    .map((asset) => toImageDataUri(asset.base64, asset.mimeType) || asset.uri)
    .filter((uri): uri is string => Boolean(uri));
}

/**
 * Captures image URI with auto-captured GPS coordinates and ISO 8601 timestamp.
 */
export async function captureImageWithMetadata(
  cameraRef?: React.RefObject<CameraView | null>,
  customLocationFetcher?: () => Promise<LocationData>,
): Promise<CameraCaptureMetadataResult> {
  const timestamp = generateIsoTimestamp();

  // Trigger GPS lookup concurrently
  const locationPromise = customLocationFetcher
    ? customLocationFetcher()
    : getCurrentLocation();

  let uri: string;
  try {
    uri = await captureCropImage(cameraRef);
  } catch (error: any) {
    throw new Error(
      error?.message ||
        "Không thể chụp ảnh. Vui lòng cấp quyền và chụp trực tiếp bằng máy ảnh.",
    );
  }

  const location = await locationPromise;

  return {
    uri,
    location,
    timestamp,
  };
}
