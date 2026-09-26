---
name: mits-project-task-cover-image
description: >-
  Create a cover image for a specific MITS project task (test project) from its
  project description and metadata. The image has no title and no readable text
  — only a related graphic, photorealistic image, or both. Saves to
  assets/project-description-images/ as an ultrawide banner (wider than 16:9)
  and places it at the top of README.md.
  Use this skill whenever the user asks to create, generate, make, or update a
  cover image, banner, hero, thumbnail, card image, or social preview for a
  project task / test project / module — even if they do not name the file.
  Do not use this skill for competitor mockups, screenshots, marking schemes,
  or images that belong inside a requirement (those stay as task assets).
---

# MITS Project Task Cover Image

Create one **cover image** for a specific project task. It is a visual only:
related graphic, photorealistic scene, or a mix of both. **No title** and no
other readable text on the image.

The file lives with the other description images, at:

`/project-tasks/staging/[project-task-name]/assets/project-description-images/cover.png`

## Role vs related skills

| Skill | Use when |
| ----- | -------- |
| **mits-project-task-cover-image** (this) | Generate the task's cover / banner / hero image |
| `mits-create-project-task` | Author `project-description.md` and other content |
| `mits-project-task-updater` | Standardize existing task form; do not use it to draw a cover |
| `mits-marking-scheme-creator` | Assessment aspects, not imagery |

Do **not** chain content authoring or marking-scheme work automatically.

## Prerequisites

- The target project folder already exists under
  `/project-tasks/staging/[project-task-name]/` (or `references/` /
  `done/` if the user points there).
- `project-description.md` has real task content (not an empty template).
  The cover is derived from that scenario. If the description is still a
  stub, stop and say so.

If more than one staging project exists and the target is unclear, ask which
folder to use.

## Path conventions

- Paths starting with `/` are repo-root-relative.
- Working folder: `/project-tasks/staging/[project-task-name]/`.
- Cover file: `assets/project-description-images/cover.png`.
- Crop script: `.claude/skills/mits-project-task-cover-image/scripts/crop-cover.js`.

## What to produce

| Output | Required |
| ------ | -------- |
| `assets/project-description-images/cover.png` | Yes — ultrawide, no text |
| Markdown image at the top of `README.md` | Yes — insert after the H1 if missing; no caption |
| Extra variants (`cover-graphic.png`, …) | Only if the user asks for more than one |

Do **not** add a cover field to `metadata.json` (no such field exists).
Do **not** put a heading, caption, or module name under or on the image.

## Image rules

These constraints are the point of the skill:

- **No title.** No module name, competition name, client name, slogans,
  watermarks, UI labels, lorem ipsum, or letterforms of any kind.
- **Related, not generic.** Depict the task's world (the fictional client,
  setting, product, or craft), not a stock "developer at a laptop" unless
  that *is* the scenario.
- **Graphic, photorealistic, or both** — one image unless the user asks
  for separate files.
- **Wider than 16:9.** Target **21:9**. GenerateImage's widest native
  ratio is 16:9, so generate 16:9 then crop (see workflow). Compose so
  the subject sits in the horizontal centre band; sky/ground at the top
  and bottom will be trimmed.
- **Not a fake screenshot.** Abstract UI chrome is fine; readable page
  content is not.

### Style selection

Honour an explicit user choice. If they do not specify:

| Task signal | Default style |
| ----------- | ------------- |
| Strong brand colours / Design Implementation / visual UI | Graphic, or mixed using those colours |
| Rich real-world client scene (venue, city, craft, product) | Photorealistic or mixed |
| Backend / API / data-heavy with a weak visual world | Graphic (abstract infrastructure, data, motion) — not fake IDE screens |

**Graphic:** editorial illustration, isometric, geometric, or stylized
shapes. Use brand colours when the description lists them.

**Photorealistic:** cinematic still from the scenario's world. Natural
light, concrete materials, no posed corporate stock.

**Both:** one frame that combines the two treatments of the **same
motif** (photoreal base + graphic overlays, or a joined photo/graphic
reading of one scene). Same palette. Still no text.

## Workflow

```
Create cover image:
- [ ] 1. Confirm the project folder
- [ ] 2. Read the task (description + metadata)
- [ ] 3. Build a visual brief
- [ ] 4. Choose style (graphic / photo / both)
- [ ] 5. Generate 16:9 with a textless ultrawide composition
- [ ] 6. Save and crop to 21:9 in assets/project-description-images/
- [ ] 7. Reference the image after the H1 in README.md
- [ ] 8. Summarize
```

### 1. Confirm the project folder

Resolve `/project-tasks/staging/[project-task-name]/`. If `cover.png`
already exists, ask before replacing unless the user said regenerate /
update / replace.

### 2. Read the task

Read `project-description.md` and `metadata.json`. Skim brand tokens,
provided photos, and logos only for **colour and subject** — do not
paint logos or type onto the cover.

Extract:

- Scenario / client / setting
- The thing being built (site, API, product) only as visual context,
  not as a titled mockup
- Brand colours if present
- Distinctive motifs (vehicles, buildings, tools, landscape, objects)

### 3. Build a visual brief

Write a short internal brief before generating:

- Subject (what is in the frame)
- Setting and time of day
- Palette (brand hex values when known; otherwise a coherent set)
- Style: graphic / photorealistic / both
- Motifs to avoid (text, logos, watermarks, screenshots)

### 4. Choose style

Pick as above. If the user named a style, use that.

### 5. Generate 16:9

Use the Cursor **GenerateImage** tool (do not invent another image
pipeline):

- `aspect_ratio`: `"16:9"` (widest native option)
- `filename`: `cover.png`
- `description`: a concrete prompt that includes subject, layout,
  style, colours, **ultrawide cinematic framing**, and the no-text
  constraint

Prompt every generation with all of:

- Ultrawide cinematic banner composition; important subject in the
  centre horizontal band; empty sky/ground at top and bottom may be
  cropped
- No text, letters, numbers, logos, watermarks, captions, or UI labels
- The chosen style and the task-specific scene
- Brand colours by hex when available

Do not generate a cover "just to be helpful" outside this skill — the
user already asked for a cover by invoking it.

**Example (graphic), SkyDrop-style drone delivery task:**

> Ultrawide 21:9 editorial illustration of a compact autonomous delivery
> drone approaching a rooftop logistics pad above a dense modern city at
> dusk. Geometric simplified buildings, navy and cyan palette #0b3d91
> and #00b4d8, sharp 4px-feel corners, no people faces as the focus.
> No text, no letters, no logos, no watermarks. Subject centred in the
> middle band so top and bottom can be cropped.

**Example (photorealistic):**

> Photorealistic cinematic still, ultrawide banner, of a compact
> delivery drone descending toward a city rooftop station at golden
> hour, shallow depth of field, concrete and glass, cool navy shadows
> and cyan sky reflection. No text, no letters, no logos, no
> watermarks. Keep the drone and pad in the centre horizontal band.

**Example (both):**

> Ultrawide 21:9 composition of the same autonomous rooftop drone
> delivery scene twice: photoreal city and drone on one side, matching
> graphic/isometric interpretation on the other, unified navy-cyan
> palette #0b3d91 #00b4d8, seamless join, no text, no letters, no logos,
> no watermarks. Centre the drone so a 21:9 crop keeps it.

### 6. Save and crop to 21:9

GenerateImage does not accept a directory in `filename`. After it
returns, copy the generated file into the project folder, then crop.

From the **toolkit repo root**:

```bash
node .claude/skills/mits-project-task-cover-image/scripts/crop-cover.js \
  "<generated-cover.png>" \
  "project-tasks/staging/<project-task-name>/assets/project-description-images/cover.png" \
  21:9
```

If `node_modules` is missing next to the script, run `npm install`
inside `.claude/skills/mits-project-task-cover-image/scripts/` first.

The script prints JSON with `width`, `height`, and `ratio`. Confirm
ratio is about **2.33** (21:9). Create
`assets/project-description-images/` if it does not exist.

If GenerateImage cannot be used in this environment, stop and tell the
user — do not substitute a CSS mock, SVG with text, or a downloaded
stock photo.

### 7. Reference it in `README.md`

Place the image **immediately after the H1**, before the introductory
description or first H2. No caption, no extra heading:

```markdown
# [Project task name]

![Cover](assets/project-description-images/cover.png)

[Introductory description or first section]
```

If that markdown image is already present, leave the surrounding
structure and only replace the file. Do not add a second cover. Alt text
stays a short visual description (`Cover` is fine); it must not become
a title painted on the image. Do not add the cover to
`project-description.md`.

### 8. Summarize

Report:

- Project folder
- Style used (graphic / photorealistic / both) and why
- Output path and final pixel size / ratio
- Whether `README.md` was updated
- That the image contains no title/text

Offer a regeneration in the other style(s) if they want a different
direction.

## Key principles

- **No text on the image** — that includes titles.
- **One related picture** of the task's world, not a generic tech
  collage.
- **21:9 banner**, produced by cropping a 16:9 generation.
- **Description images folder only** — not `assets/img/` competitor
  media, not repo-root `cover.png`.
- **README only** — insert the cover reference after its H1; do not alter
  `project-description.md` or task requirements.
