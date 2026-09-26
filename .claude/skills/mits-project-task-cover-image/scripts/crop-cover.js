#!/usr/bin/env node
"use strict";

/**
 * Crop an image to an ultrawide cover ratio (default 21:9).
 *
 * GenerateImage's widest native ratio is 16:9, so covers are generated 16:9
 * with a centre-safe composition, then this script trims top and bottom.
 *
 * Usage:
 *   node crop-cover.js <input> <output> [ratio]
 *
 * ratio is W:H (default 21:9). Output format follows the output extension.
 */

const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");
const jpeg = require("jpeg-js");

const DEFAULT_RATIO = "21:9";

function parseRatio(value) {
  const match = String(value).trim().match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (!match) {
    throw new Error(`Invalid ratio "${value}". Use W:H, e.g. 21:9`);
  }
  const w = Number(match[1]);
  const h = Number(match[2]);
  if (!(w > 0 && h > 0)) {
    throw new Error(`Invalid ratio "${value}". Width and height must be > 0`);
  }
  return w / h;
}

function detectFormat(buffer) {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  throw new Error("Unsupported image format (need PNG or JPEG)");
}

function decode(buffer) {
  const format = detectFormat(buffer);
  if (format === "png") {
    const png = PNG.sync.read(buffer);
    return { width: png.width, height: png.height, data: png.data, channels: 4, format };
  }
  const decoded = jpeg.decode(buffer, { formatAsRGBA: true, maxMemoryUsageInMB: 256 });
  return { width: decoded.width, height: decoded.height, data: decoded.data, channels: 4, format };
}

function cropCentre(image, targetRatio) {
  const { width, height, data } = image;
  const current = width / height;
  let cropW = width;
  let cropH = height;
  let x0 = 0;
  let y0 = 0;

  if (Math.abs(current - targetRatio) < 0.01) {
    return image;
  }

  if (current > targetRatio) {
    cropW = Math.max(1, Math.round(height * targetRatio));
    x0 = Math.round((width - cropW) / 2);
  } else {
    cropH = Math.max(1, Math.round(width / targetRatio));
    y0 = Math.round((height - cropH) / 2);
  }

  const out = Buffer.alloc(cropW * cropH * 4);
  for (let y = 0; y < cropH; y += 1) {
    const srcStart = ((y0 + y) * width + x0) * 4;
    data.copy(out, y * cropW * 4, srcStart, srcStart + cropW * 4);
  }

  return { width: cropW, height: cropH, data: out, channels: 4, format: image.format };
}

function encode(image, outputPath) {
  const ext = path.extname(outputPath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") {
    return jpeg.encode({ data: image.data, width: image.width, height: image.height }, 92).data;
  }
  const png = new PNG({ width: image.width, height: image.height });
  image.data.copy(png.data);
  return PNG.sync.write(png);
}

function main() {
  const [, , input, output, ratioArg] = process.argv;
  if (!input || !output) {
    console.error("Usage: node crop-cover.js <input> <output> [ratio]");
    process.exit(1);
  }

  const inputPath = path.resolve(input);
  const outputPath = path.resolve(output);
  const targetRatio = parseRatio(ratioArg || DEFAULT_RATIO);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input not found: ${inputPath}`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const cropped = cropCentre(decode(fs.readFileSync(inputPath)), targetRatio);
  fs.writeFileSync(outputPath, encode(cropped, outputPath));

  console.log(
    JSON.stringify({
      input: inputPath,
      output: outputPath,
      width: cropped.width,
      height: cropped.height,
      ratio: Number((cropped.width / cropped.height).toFixed(4)),
    })
  );
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
