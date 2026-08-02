export type ManagementVariant = "plots" | "farms" | "crops" | "diseases" | "accounts";
export type ToastKind = "success" | "warning" | "error";
export type ToastState = { type: ToastKind; message: string } | null;
export type CsvImportMode = "select" | "mapping" | "loading" | "result" | null;
