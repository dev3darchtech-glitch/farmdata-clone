import { LocationData } from "@/types";
import { CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { generateIsoTimestamp, getCurrentLocation } from "./locationService";

export interface CameraCaptureMetadataResult {
  uri: string;
  location: LocationData;
  timestamp: string;
}

/**
 * Captures image URI using camera view ref or image picker fallback.
 * Interface contract matching PROJECT.md.
 */
export async function captureCropImage(
  cameraRef?: React.RefObject<CameraView | null>,
): Promise<string> {
  try {
    if (cameraRef && cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo && photo.uri) {
        return photo.uri;
      }
    }
  } catch (error) {
    // Fall back to ImagePicker if cameraRef fails or unsupported
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    allowsEditing: true,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    return result.assets[0].uri;
  }

  throw new Error("Image capture canceled");
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
