import { toBlob } from "html-to-image";

export const EXPORT_IMAGE_WIDTH = 1080;

export function imageFileName(tripName: string): string {
  const safe = tripName
    .replace(/[\\/:*?"<>|·\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${safe || "行程单"}-行程单.png`;
}

export function exportImageFilter(node: HTMLElement): boolean {
  return !node.hasAttribute?.("data-export-hidden");
}

export async function elementToPngBlob(node: HTMLElement): Promise<Blob> {
  const blob = await toBlob(node, {
    backgroundColor: "#ffffff",
    canvasWidth: EXPORT_IMAGE_WIDTH,
    pixelRatio: 1,
    cacheBust: true,
    skipFonts: true,
    filter: exportImageFilter,
  });
  if (!blob) {
    throw new Error("图片生成失败");
  }
  return blob;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
