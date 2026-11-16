import { describe, expect, it } from "vitest";
import { photoDataUrl, photoFileError } from "./pet-photo";

function base64Of(bytes: number[]): string {
  return Buffer.from(bytes).toString("base64");
}

describe("photoDataUrl", () => {
  it("detects jpeg, png, gif and webp signatures", () => {
    const jpeg = base64Of([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const png = base64Of([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const gif = base64Of(Array.from("GIF89a", (char) => char.charCodeAt(0)));
    const webp = base64Of([
      0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);

    expect(photoDataUrl(jpeg)).toBe(`data:image/jpeg;base64,${jpeg}`);
    expect(photoDataUrl(png)).toBe(`data:image/png;base64,${png}`);
    expect(photoDataUrl(gif)).toBe(`data:image/gif;base64,${gif}`);
    expect(photoDataUrl(webp)).toBe(`data:image/webp;base64,${webp}`);
  });

  it("returns null for empty or unknown data", () => {
    expect(photoDataUrl(null)).toBeNull();
    expect(photoDataUrl("")).toBeNull();
    expect(photoDataUrl(base64Of([0x00, 0x01, 0x02, 0x03]))).toBeNull();
    expect(photoDataUrl("not-base64!")).toBeNull();
  });
});

describe("photoFileError", () => {
  it("accepts supported images within the size limit", () => {
    expect(photoFileError({ type: "image/png", size: 1024 })).toBeNull();
    expect(photoFileError({ type: "image/jpeg", size: 5 * 1024 * 1024 })).toBeNull();
  });

  it("rejects non-image files and oversized images", () => {
    expect(photoFileError({ type: "application/pdf", size: 1024 })).toBe(
      "请选择 JPEG、PNG、GIF 或 WebP 图片。",
    );
    expect(photoFileError({ type: "image/png", size: 5 * 1024 * 1024 + 1 })).toBe(
      "图片不能超过 5MB。",
    );
  });
});