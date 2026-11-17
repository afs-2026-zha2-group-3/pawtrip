import { describe, expect, it } from "vitest";
import { safeImageUrl } from "./location-image";

describe("safeImageUrl", () => {
  it("接受 https URL 并原样返回", () => {
    expect(safeImageUrl("https://photos.example/a.png")).toBe("https://photos.example/a.png");
  });

  it("接受 http URL", () => {
    expect(safeImageUrl("http://photos.example/a.png")).toBe("http://photos.example/a.png");
  });

  it("拒绝 data URL", () => {
    expect(safeImageUrl("data:image/png;base64,AAAA")).toBeUndefined();
  });

  it("拒绝 javascript 协议", () => {
    expect(safeImageUrl("javascript:alert(1)")).toBeUndefined();
  });

  it("拒绝相对路径", () => {
    expect(safeImageUrl("/img/a.png")).toBeUndefined();
  });

  it("拒绝非法 URL 字符串", () => {
    expect(safeImageUrl("not a url")).toBeUndefined();
  });

  it("空值返回 undefined", () => {
    expect(safeImageUrl(null)).toBeUndefined();
    expect(safeImageUrl(undefined)).toBeUndefined();
    expect(safeImageUrl("")).toBeUndefined();
  });
});