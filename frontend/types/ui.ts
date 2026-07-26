export type ManagementVariant = "plots" | "crops" | "accounts";
export type ToastKind = "success" | "warning" | "error";
export type ToastState = { type: ToastKind; message: string } | null;
export type CsvImportMode = "select" | "loading" | "result" | null;
