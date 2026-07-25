declare module "expo-file-system" {
  export const documentDirectory: string | null;
  export enum EncodingType {
    UTF8 = "utf8",
    Base64 = "base64",
  }
  export interface FileInfo {
    exists: boolean;
    uri?: string;
    size?: number;
    isDirectory?: boolean;
    modificationTime?: number;
  }
  export function getInfoAsync(
    fileUri: string,
    options?: object,
  ): Promise<FileInfo>;
  export function makeDirectoryAsync(
    fileUri: string,
    options?: { intermediates?: boolean },
  ): Promise<void>;
  export function writeAsStringAsync(
    fileUri: string,
    contents: string,
    options?: { encoding?: any },
  ): Promise<void>;
  export function readAsStringAsync(
    fileUri: string,
    options?: { encoding?: any },
  ): Promise<string>;
}
