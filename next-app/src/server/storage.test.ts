import { describe, expect, it } from "vitest";
import { sniffFileType } from "./storage";

const pad = (bytes: number[], size = 32) => Buffer.concat([Buffer.from(bytes), Buffer.alloc(size)]);

describe("sniffFileType", () => {
  it("detects JPEG", () => {
    expect(sniffFileType(pad([0xff, 0xd8, 0xff, 0xe0]))?.mime).toBe("image/jpeg");
  });

  it("detects PNG", () => {
    expect(sniffFileType(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toMatchObject({
      mime: "image/png",
      ext: "png",
    });
  });

  it("detects WebP", () => {
    const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0x24, 0, 0, 0]), Buffer.from("WEBPVP8 "), Buffer.alloc(16)]);
    expect(sniffFileType(webp)?.mime).toBe("image/webp");
  });

  it("detects PDF", () => {
    expect(sniffFileType(Buffer.from("%PDF-1.7\n%âãÏÓ"))?.ext).toBe("pdf");
  });

  it("does not trust extensions or look-alikes", () => {
    expect(sniffFileType(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).toBeNull();
    expect(sniffFileType(Buffer.from("GIF89a......"))).toBeNull();
    expect(sniffFileType(Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WAVE")]))).toBeNull();
    expect(sniffFileType(Buffer.alloc(0))).toBeNull();
  });
});
