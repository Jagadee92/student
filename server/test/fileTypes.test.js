import test from "node:test";
import assert from "node:assert/strict";
import { getFileType } from "../src/utils/fileTypes.js";

test("detects PNG file signatures", () => {
  const content = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(getFileType(content), "image/png");
});

test("detects JPEG file signatures", () => {
  assert.equal(
    getFileType(Buffer.from([0xff, 0xd8, 0xff, 0x00])),
    "image/jpeg",
  );
});

test("detects WebP file signatures", () => {
  assert.equal(
    getFileType(Buffer.from("RIFF1234WEBP", "ascii")),
    "image/webp",
  );
});

test("detects PDF file signatures", () => {
  assert.equal(
    getFileType(Buffer.from("%PDF-1.7", "ascii")),
    "application/pdf",
  );
});

test("rejects unknown content and non-buffer values", () => {
  assert.equal(getFileType(Buffer.from("not a valid file")), null);
  assert.equal(getFileType("%PDF-1.7"), null);
});
