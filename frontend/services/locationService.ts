import { LocationData } from "@/types";
import * as Location from "expo-location";
import { Platform } from "react-native";

/**
 * Default fallback mock location (HCMC Agricultural Research Institute coordinates).
 */
export const DEFAULT_MOCK_LOCATION: LocationData = {
  latitude: 10.7769,
  longitude: 106.7009,
  accuracy: 5.0,
  timestamp: new Date().toISOString(),
  isMocked: true,
  city: "TP. Hồ Chí Minh",
  region: "TP. Hồ Chí Minh",
  country: "Việt Nam",
  formattedAddress: "TP. Hồ Chí Minh, Việt Nam",
};

/**
 * Generates ISO 8601 compliant UTC timestamp string.
 */
export function generateIsoTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Validates latitude (-90 to 90) and longitude (-180 to 180).
 */
export function validateCoordinates(lat: number, lon: number): boolean {
  if (typeof lat !== "number" || typeof lon !== "number") return false;
  if (Number.isNaN(lat) || Number.isNaN(lon)) return false;
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Formats coordinates into human-readable string.
 * Example: 10.7769° N, 106.7009° E
 */
export function formatCoordinates(
  lat: number,
  lon: number,
  precision: number = 4,
): string {
  if (!validateCoordinates(lat, lon)) {
    return "Invalid coordinates";
  }

  const latDir = lat >= 0 ? "N" : "S";
  const lonDir = lon >= 0 ? "E" : "W";

  const formattedLat = Math.abs(lat).toFixed(precision);
  const formattedLon = Math.abs(lon).toFixed(precision);

  return `${formattedLat}° ${latDir}, ${formattedLon}° ${lonDir}`;
}

function compactAddress(parts: (string | null | undefined)[]) {
  return Array.from(
    new Set(parts.map((part) => part?.trim()).filter(Boolean)),
  ).join(", ");
}

async function reverseGeocodeLocation(
  latitude: number,
  longitude: number,
): Promise<Partial<LocationData>> {
  if (Platform.OS === "web") {
    return {};
  }

  try {
    const results = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    const place = results[0];
    if (!place) {
      return {};
    }

    const name = compactAddress([
      place.name,
      place.street,
      place.district,
      place.city,
    ]);
    const formattedAddress = compactAddress([
      place.name,
      place.street,
      place.district,
      place.city,
      place.subregion,
      place.region,
      place.country,
    ]);

    return {
      name: name || place.city || place.region || place.country || undefined,
      city: place.city ?? undefined,
      region: place.region ?? undefined,
      country: place.country ?? undefined,
      formattedAddress:
        formattedAddress ||
        compactAddress([place.city, place.region, place.country]) ||
        undefined,
    };
  } catch (error) {
    return {};
  }
}

/**
 * Requests foreground location permission from OS via expo-location.
 */
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

/**
 * Obtains current high-accuracy GPS position.
 */
export async function getCurrentLocation(): Promise<LocationData> {
  const hasPermission = await requestLocationPermissions();

  if (!hasPermission) {
    throw new Error("LOCATION_PERMISSION_DENIED");
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
    mayShowUserSettingsDialog: true,
  });

  if (!location || !location.coords) {
    throw new Error("INVALID_GPS_COORDINATES");
  }

  const { latitude, longitude, accuracy } = location.coords;

  if (!validateCoordinates(latitude, longitude)) {
    throw new Error("INVALID_GPS_COORDINATES");
  }

  const address = await reverseGeocodeLocation(latitude, longitude);

  return {
    ...address,
    latitude,
    longitude,
    accuracy: accuracy ?? 5.0,
    timestamp: generateIsoTimestamp(new Date(location.timestamp)),
    isMocked: location.mocked ?? false,
  };
}
