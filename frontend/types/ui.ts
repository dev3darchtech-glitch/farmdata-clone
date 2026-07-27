export type ManagementVariant = "plots" | "crops" | "diseases" | "accounts";
export type ToastKind = "success" | "warning" | "error";
export type ToastState = { type: ToastKind; message: string } | null;
export type CsvImportMode = "select" | "mapping" | "loading" | "result" | null;
