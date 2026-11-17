export function safeImageUrl(sourceUrl: string | null | undefined): string | undefined {
  if (!sourceUrl) {
    return undefined;
  }
  try {
    const parsedUrl = new URL(sourceUrl);
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.href;
    }
  } catch {
    return undefined;
  }
  return undefined;
}