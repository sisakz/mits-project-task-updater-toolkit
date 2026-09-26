#!/usr/bin/env node
"use strict";

/**
 * Convert PNG images to WebP. Source files are left in place.
 *
 * Usage:
 *   node png-to-webp.js <input.png> [output.webp] [--quality=80] [--lossless] [--effort=4]
 *   node png-to-webp.js <directory> [--recursive] [--quality=80] [--lossless]
 */

const fs = require("fs");
const path = require("path");

function printUsage() {
  console.error(
    [
      "Usage: node png-to-webp.js <input.png> [output.webp] [--quality=80] [--lossless] [--effort=4]",
      "       node png-to-webp.js <directory> [--recursive] [--quality=80] [--lossless]",
      "",
      "Converts PNG images to WebP and keeps the source files.",
      "A single PNG writes <name>.webp beside it unless output.webp is given.",
      "A directory converts every .png in it (add --recursive for subfolders).",
      "Default quality is 80 (1-100). --lossless ignores --quality.",
      "Transparency is preserved.",
    ].join("\n")
  );
}

function parseArgs(argv) {
  const flags = { quality: 80, lossless: false, effort: 4, recursive: false, help: false };
  const positional = [];

  for (const arg of argv) {
    if (arg === "--lossless") {
      flags.lossless = true;
    } else if (arg === "--recursive") {
      flags.recursive = true;
    } else if (arg === "--help" || arg === "-h") {
      flags.help = true;
    } else if (arg.startsWith("--quality=")) {
      flags.quality = Number(arg.slice("--quality=".length));
    } else if (arg.startsWith("--effort=")) {
      flags.effort = Number(arg.slice("--effort=".length));
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  return { flags, positional };
}

function isPng(buffer) {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}

function webpPathFor(file) {
  const parsed = path.parse(file);
  return path.join(parsed.dir, `${parsed.name}.webp`);
}

function collectPngs(dir, recursive, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) collectPngs(full, true, acc);
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
      acc.push(full);
    }
  }
  return acc;
}

async function convertOne(sharp, inputPath, outputPath, flags) {
  const resolvedInput = path.resolve(inputPath);
  const resolvedOutput = path.resolve(outputPath);
  if (resolvedInput === resolvedOutput) {
    throw new Error(`Output path must differ from the input PNG: ${inputPath}`);
  }

  const buffer = fs.readFileSync(resolvedInput);
  if (!isPng(buffer)) {
    throw new Error(`Not a PNG file: ${inputPath}`);
  }

  fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true });

  const image = sharp(buffer, { animated: false });
  const meta = await image.metadata();
  const webpOptions = flags.lossless
    ? { lossless: true, effort: flags.effort }
    : { quality: flags.quality, alphaQuality: 100, effort: flags.effort };

  await image.webp(webpOptions).toFile(resolvedOutput);

  return {
    input: resolvedInput,
    output: resolvedOutput,
    width: meta.width,
    height: meta.height,
    inputBytes: buffer.length,
    outputBytes: fs.statSync(resolvedOutput).size,
    quality: flags.lossless ? null : flags.quality,
    lossless: flags.lossless,
  };
}

async function main() {
  let parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    printUsage();
    process.exit(1);
  }

  if (parsed.flags.help || parsed.positional.length === 0) {
    printUsage();
    process.exit(parsed.flags.help ? 0 : 1);
  }

  const { flags, positional } = parsed;

  if (
    !flags.lossless &&
    (!Number.isInteger(flags.quality) || flags.quality < 1 || flags.quality > 100)
  ) {
    console.error("--quality must be an integer from 1 to 100");
    process.exit(1);
  }
  if (!Number.isInteger(flags.effort) || flags.effort < 0 || flags.effort > 6) {
    console.error("--effort must be an integer from 0 to 6");
    process.exit(1);
  }

  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.error(
      "Missing dependency sharp. Run npm install in .claude/skills/png-to-webp/ first."
    );
    process.exit(1);
  }

  const first = positional[0];
  if (!fs.existsSync(first)) {
    console.error(`Not found: ${first}`);
    process.exit(1);
  }

  const jobs = [];
  if (fs.statSync(first).isDirectory()) {
    if (positional.length > 1) {
      console.error(
        "A directory input does not take an output path. Pass one PNG when you need a custom .webp name."
      );
      process.exit(1);
    }
    const files = collectPngs(first, flags.recursive);
    if (files.length === 0) {
      console.error(`No PNG files in ${first}`);
      process.exit(1);
    }
    for (const file of files) jobs.push([file, webpPathFor(file)]);
  } else {
    if (positional.length > 2) {
      console.error("Pass one PNG and an optional .webp output path, or pass a directory.");
      process.exit(1);
    }
    jobs.push([first, positional[1] || webpPathFor(first)]);
  }

  const results = [];
  for (const [input, output] of jobs) {
    results.push(await convertOne(sharp, input, output, flags));
  }

  console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
}

main().catch((err) => {
  console.error(err.message || String(err));
  process.exit(1);
});
