<div align="center">

<img src="./assets/logo.jpg" alt="Recut logo" width="112" />

# Cover Studio

**Generate reusable covers by channel and size, guided by reference images and covers**

A cover workspace for publishing — pick a channel, set the size, add references, generate to the library

[中文](./README.md) · **English**

</div>

![Cover Studio](./assets/cover-maker.jpg)

## What it is

Cover Studio is Recut's **cover-generation App** (`standalone`). It puts channel, canvas size, reference images, reference covers and a visual brief into one clear flow: generated images land as Recut Media Assets, and the App keeps a traceable history.

- **Channel = size**: portrait/landscape variants for Douyin, WeChat Channels, Bilibili etc. — pick from a dropdown.
- **Two reference kinds**: reference images constrain subject/elements; reference covers constrain composition and tone.
- **Generated = Asset**: both Media Platform and Codex-native paths deliver a real `assetId`; chat preview doesn't count.

> Ships with Recut — no extra download. Published at [6174/recut-cover-studio](https://github.com/6174/recut-cover-studio).

## Why Cover Studio

### Right size per channel

Each platform has its own cover size. Picking a channel locks width/height so exports aren't cropped or letterboxed.

### References steer the result

Use a product or portrait image to constrain content, and a liked cover to constrain layout and mood.

### Every success is archived

Each success stores `assetId`, prompt, channel, size and both reference kinds. The image itself lives in the global media library.

## From idea to finished cover

1. **Pick channel & size** from the dropdown.
2. **Add references**: choose or upload a reference image; add a reference cover to reuse a style.
3. **Write the brief** and pick a configured image model.
4. **Generate** — success is archived to the media library and history.

## Capabilities

| Capability | What you can do | Key operations |
| --- | --- | --- |
| **Channel & size** | Pick a channel to lock width/height | `cover.context` · `cover.configure` |
| **Reference guidance** | Two reference kinds for content vs layout | `cover.configure` (`referenceAssetIds` / `referenceCoverAssetIds`) |
| **Image generation** | Media Platform or Codex-native per platform config | `recut.image.generate` / Codex → `recut.media.import_image` |
| **Traceable history** | Stores `assetId`, prompt, channel, size & references | `cover.save` · `cover.list` |

> Full operation contract: `manifest.json` → `operations`.

## Quick start

### Open in Recut

1. Install and launch Recut (see root [README](../../README.en.md#install-recut)).
2. Open **Cover Studio** from **Apps**.
3. Pick channel/size, references, write the brief, choose a model and generate.

### Let the Agent help

In Claude Code / OpenCode / Codex Cli, tell the project:

> "Generate a cover with Cover Studio. Read `recut.project_context` and `cover.context` first, confirm channel/size, references and brief; pick the image path per platform config and deliver as a Recut Media Asset before `cover.save`."

## Tour

- **Top selectors**: channel, size, configured image model.
- **Left**: reference image & reference cover (global picker).
- **Center**: live preview of the real Asset.
- **Bottom**: traceable generation history.

![Cover Studio](./assets/cover-maker.jpg)
<sub>Covers organized by channel size with references and results.</sub>

## FAQ

**No model available?** Connect one in AI provider settings, then pick it here and generate.

**How does Codex delivery work?** Prompt is copied to the side input — confirm to send. The final image is written to the project and archived via `recut.media.import_image` before it enters history.

**Text/watermark in results?** By default no readable text, logo or watermark — leaves room for controlled typography later.

## For developers

Cover Studio is a `standalone` App with a stable private workspace scope.

```sh
# Link for local dev
make app-link APP=apps/cover-studio
make dev

# Build UI only
cd apps/cover-studio/ui && npm ci && npm run build
```

- Runtime entry: `ui/dist/index.html` (`ui/dist/` gitignored).
- Contracts: `manifest.json` · `background.js` · `AGENTS.md`.

[Back to root README](../../README.en.md) · [App map](../../README.en.md#app-map)
