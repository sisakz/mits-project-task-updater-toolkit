---
name: png-to-webp
description: >-
  Convert PNG images to WebP with the bundled Node.js script. Use this skill
  whenever the user asks to convert, export, compress, or save a PNG as WebP,
  turn a .png into a .webp, or make a WebP version of an image — even if they
  only say "make this webp", "webp this png", or name a .png file and a WebP
  output. Also use it for a folder of PNGs. Do not use it to generate, crop,
  or redesign images.
---

# PNG to WebP

Convert one PNG, or every PNG in a folder, to WebP. The bundled script does the
conversion. Do not reimplement it with another tool.

The source PNG stays in place. Write a `.webp` beside it unless the user names
a different output path.

## Prerequisites

- Node.js 18+.
- `sharp` is declared in this skill's `package.json`. If `node_modules` is
  missing next to `png-to-webp.js`, install it first:

```bash
npm install --prefix .claude/skills/png-to-webp
```

## Convert

From the toolkit repo root:

```bash
node .claude/skills/png-to-webp/png-to-webp.js <input.png> [output.webp] [--quality=80] [--lossless]
node .claude/skills/png-to-webp/png-to-webp.js <directory> [--recursive] [--quality=80] [--lossless]
```

| Argument | Required | Meaning |
| -------- | -------- | ------- |
| `input.png` or `directory` | Yes | One PNG file, or a folder of PNGs |
| `output.webp` | No | Output path for a single file. Default: same folder and name, `.webp` extension |
| `--quality=N` | No | Lossy quality, integer 1–100. Default **80** |
| `--lossless` | No | Lossless WebP. Ignores `--quality` |
| `--effort=N` | No | Encoder effort 0–6. Default **4** |
| `--recursive` | No | With a directory, also convert PNGs in subfolders |

The script prints one JSON object (or an array for a directory) with `input`,
`output`, `width`, `height`, `inputBytes`, `outputBytes`, `quality`, and
`lossless`.

### Quality

- Photo, screenshot, or cover: default `--quality=80`.
- Flat graphic, diagram, or UI where edges must stay crisp: `--lossless`, or
  `--quality=90` if the user wants a smaller file.
- If the user names a quality or says lossless, use that.

Transparency is kept. Animated PNGs are written as a single still frame; say
so if the source is animated.

### Examples

```bash
node .claude/skills/png-to-webp/png-to-webp.js assets/cover.png

node .claude/skills/png-to-webp/png-to-webp.js assets/cover.png out/cover.webp --quality=85

node .claude/skills/png-to-webp/png-to-webp.js assets/icons --lossless --recursive
```

## After converting

Report each output path, pixel size, and the before/after byte size.

Update Markdown or other references from `.png` to `.webp` only when the user
asks to switch those links. Do not delete the source PNG unless they ask.
