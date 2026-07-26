export type CaptureSectionOrder = number | string;

export function formatSectionTitle(
  title: string,
  order?: CaptureSectionOrder,
): string {
  return order === undefined || order === null || order === ""
    ? title
    : `${order}. ${title}`;
}
