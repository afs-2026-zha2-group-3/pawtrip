const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export function photoFileError(file: { type: string; size: number }): string | null {
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    return "请选择 JPEG、PNG、GIF 或 WebP 图片。";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "图片不能超过 5MB。";
  }
  return null;
}

export function photoDataUrl(base64: string | null | undefined): string | null {
  if (!base64) {
    return null;
  }
  const mime = sniffPhotoMime(base64);
  return mime ? `data:${mime};base64,${base64}` : null;
}

export async function readPhotoFile(
  file: File,
): Promise<{ base64: string; dataUrl: string }> {
  const error = photoFileError(file);
  if (error) {
    throw new Error(error);
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("无法读取图片。"));
      }
    };
    reader.onerror = () => reject(new Error("无法读取图片。"));
    reader.readAsDataURL(file);
  });

  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  if (!photoDataUrl(base64)) {
    throw new Error("无法识别图片格式。");
  }
  return { base64, dataUrl };
}

function sniffPhotoMime(base64: string): string | null {
  let header: Uint8Array;
  try {
    const binary = atob(base64.slice(0, 24));
    header = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }

  if (matches(header, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }
  if (matches(header, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (matches(header, [0x47, 0x49, 0x46, 0x38])) {
    return "image/gif";
  }
  if (
    matches(header, [0x52, 0x49, 0x46, 0x46]) &&
    matches(header.subarray(8), [0x57, 0x45, 0x42, 0x50])
  ) {
    return "image/webp";
  }
  return null;
}

function matches(header: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => header[index] === byte);
}