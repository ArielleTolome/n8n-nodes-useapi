# n8n-nodes-useapi — Package Summary

## What This Is

`n8n-nodes-useapi` is a community n8n node package that provides a **single unified UseAPI node** with **10 AI service resources** powered by [useapi.net](https://useapi.net). One credential, one node, access to Midjourney, Kling, Runway, PixVerse, MiniMax, Dreamina, InsightFaceSwap, Google Flow, Mureka, and TemPolor.

This package is ideal for workflows that need to coordinate multiple AI services through a consistent interface — especially Midjourney (which has no official API and requires useapi.net as a bridge).

**npm:** [`n8n-nodes-useapi`](https://www.npmjs.com/package/n8n-nodes-useapi)  
**GitHub:** [ArielleTolome/n8n-nodes-useapi](https://github.com/ArielleTolome/n8n-nodes-useapi)  
**Current Version:** 0.5.9  
**Requires:** n8n ≥ 1.0, Node ≥ 18

---

## Node Included

### UseAPI (`n8n-nodes-useapi.useApi`)

One node with 10 resources and **150+ operations** total.

---

## Resources & Operations

### 🎨 Midjourney (12 ops)
The flagship resource — Midjourney access without an official API.

| Operation | Description |
|-----------|-------------|
| `imagine` | Generate images from a text prompt |
| `button` | Click upscale/variation buttons on a result |
| `describe` | Get a text description of an image |
| `blend` | Blend 2–5 images together |
| `seed` | Get the seed value from a job |
| `settings` | Configure Midjourney bot settings |
| `remix` | Remix an existing generation |
| `variability` | Create variations with high/low variability |
| `getJob` | Retrieve a specific job by ID |
| `listJobs` | List all jobs |
| `cancelJob` | Cancel a pending job |
| `listAccounts` | List configured Midjourney accounts |

### 🎬 Dreamina (12 ops)
ByteDance's Dreamina/Jianying AI — image and video generation.

| Operation | Description |
|-----------|-------------|
| `generateImage` | Generate images from text |
| `generateVideo` | Generate videos from text/image |
| `upscaleImage` | Upscale an image |
| `getImageJob` / `getVideoJob` | Poll job status |
| `listAssets` / `deleteAsset` | Asset management |
| `cancelJob` | Cancel pending job |
| `addAccount` / `getAccount` / `listAccounts` / `deleteAccount` | Account management |

### 🎥 Kling (34 ops)
Full Kling API — the most comprehensive resource in the package.

| Operation | Description |
|-----------|-------------|
| `textToVideo` | Generate video from text prompt |
| `imageToVideo` | Generate video from image |
| `imageToVideoEffects` | Apply effects to image-to-video |
| `extendVideo` | Extend an existing video |
| `lipSync` | Lip-sync audio to video |
| `addSound` | Add sound effects to video |
| `motionCreate` | Motion brush / trajectory control |
| `textToImage` | Generate image from text |
| `omniImage` | Multi-modal image generation |
| `virtualTryOn` | Virtual clothing try-on |
| `recognizeFaces` | Face recognition |
| `upscaleImage` | Image upscaling |
| `textToSpeech` | Kling TTS |
| `avatarVideo` | AI avatar video generation |
| `omniVideo` | Omni video generation |
| `image2videoFrames` | Frame-level image-to-video |
| `image2videoElements` | Element-based image-to-video |
| `kolorsElements` | Kolors element generation |
| + management ops | getTask, listTasks, cancelTask, listEffects, listMotions, listAvatars, listTtsVoices, uploadAsset, listAssets, listAccounts, addAccount, getAccount, deleteAccount, listElements, listElementTags, listElementVoices |

### ✈️ Runway (37 ops)
Runway Gen-3 and Gen-4 — the most operation-rich resource.

| Operation | Description |
|-----------|-------------|
| `gen4_5Create` | Gen 4.5 video generation |
| `gen4TurboCreate` | Gen 4 Turbo video |
| `gen4Create` | Gen 4 video |
| `gen4Upscale` | Upscale Gen 4 video |
| `gen4Video` | Gen 4 standard video |
| `gen3TurboCreate` | Gen 3 Turbo video creation |
| `gen3Create` | Gen 3 video creation |
| `gen3TurboVideo` / `gen3Video` | Video generation variants |
| `gen3TurboExtend` / `gen3Extend` | Video extension |
| `gen3TurboExpand` | Video expansion |
| `gen3TurboActOne` / `gen3ActOne` | Act One character animation |
| `gen3AlphaUpscale` | Upscaling |
| `actTwo` / `actTwoVoice` | Act Two face animation |
| `lipSync` | Lip-sync |
| `frames` | Extract frames |
| `superSlowMotion` | Slow motion |
| `createImage` | Generate still image |
| `describeFrames` | Frame description |
| `imageUpscaler` | Image upscaling |
| `transcribe` | Audio/video transcription |
| + management ops | listVoices, listAssets, getAsset, deleteAsset, listTasks, getTask, deleteTask, getScheduler, deleteSchedulerTask, getFeatures, getJob, listAccounts |

### 🎞️ PixVerse (21 ops)
PixVerse video generation with effects, transitions, and lip sync.

| Operation | Description |
|-----------|-------------|
| `createVideo` | Text/image to video |
| `createImage` | Image generation |
| `extendVideo` | Video extension |
| `upscaleVideo` | Video upscaling |
| `createFrames` | Frame generation |
| `lipSyncVideo` | Lip sync |
| `modifyVideo` | Modify existing video |
| `createFusion` | Fusion video |
| `createTransition` | Transition between clips |
| + management ops | listLipSyncVoices, listEffects, getVideo, deleteVideo, getImage, deleteImage, addAccount, getAccount, deleteAccount, cancelJob, getJob, listAccounts |

### 🎵 MiniMax (13 ops)
MiniMax video, image, and music generation with agent support.

| Operation | Description |
|-----------|-------------|
| `createVideo` | Video generation |
| `createImage` | Image generation |
| `createMusic` | Music generation |
| `agent` | MiniMax agent (chat/task) |
| `uploadFile` | Binary file upload |
| + management ops | getVideoJob, getImageJob, listAccounts, addAccount, deleteAccount, cancelVideo, listAgentTemplates, listCharacters |

### 👤 InsightFaceSwap (3 ops)
Face swap service.

| Operation | Description |
|-----------|-------------|
| `swapFace` | Swap a face in an image or video |
| `getJob` | Get swap job status |
| `listAccounts` | List accounts |

### 🌐 Google Flow (20 ops)
Google Imagen and Veo via useapi.net proxy.

| Operation | Description |
|-----------|-------------|
| `generateImage` | Imagen image generation |
| `upscaleImage` | Image upscaling |
| `generateVideo` | Veo video generation |
| `concatenateVideos` | Join videos |
| `extendVideo` | Extend video |
| `createGif` | Create animated GIF |
| `upscaleVideo` | Video upscaling |
| `configureCaptcha` | Configure CAPTCHA solving |
| `listCaptchaProviders` / `getCaptchaStats` | CAPTCHA management |
| + management ops | getJob, listJobs, cancelJob, listAssets, listAssetsByAccount, deleteAsset, addAccount, getAccount, listAccounts, deleteAccount |

### 🎼 Mureka (17 ops)
AI music generation — songs, instrumentals, TTS, lyrics.

| Operation | Description |
|-----------|-------------|
| `createSong` | Generate a song from lyrics |
| `createAdvancedSong` | Advanced song with full control |
| `createInstrumental` | Instrumental-only track |
| `generateLyrics` | AI lyric writing |
| `textToSpeech` | Mureka TTS |
| `extendSong` | Extend an existing song |
| `generateMusicVideo` | Music video generation |
| + management ops | listVoices, listMoodsGenres, addAccount, getAccount, listAccounts, deleteAccount, getSong, listSongs, deleteSong, downloadSong |

### 🎹 TemPolor (17 ops)
AI music from MIDI + stem splitting + voice cloning.

| Operation | Description |
|-----------|-------------|
| `createSong` | Generate song |
| `createInstrumental` | Instrumental track |
| `splitStems` | Separate vocals, drums, bass, etc. |
| `uploadMidi` | Upload MIDI file |
| `cloneVoice` | Clone a voice from audio |
| + management ops | getSong, downloadSong, listArtistVoices, addAccount, getAccount, listAccounts, deleteAccount, deleteSong, listMidi, deleteMidi, listClonedVoices, deleteClonedVoice |

---

## Notable Features

- **Authorization header sanitization** — API tokens are scrubbed from error messages to prevent leakage in logs
- **asyncMode support** — relevant operations support async mode for useapi.net's async job system
- **Binary file upload** — MiniMax and TemPolor support multipart/form-data binary uploads directly from n8n binary data
- **Midjourney without an API key** — useapi.net acts as a Midjourney proxy; this package makes that fully accessible in n8n
- **Flat ESLint config** — migrated to ESLint v9 flat config (`eslint.config.mjs`) for modern tooling compatibility
- **CI/CD** — GitHub Actions runs build + lint on Node 18.x and 20.x; tagged releases auto-publish to npm

---

## Credentials

Create a **UseAPI** credential in n8n with your [useapi.net](https://useapi.net) API key. The same credential works for all 10 resources.

---

## Example Workflows

Five ready-to-import n8n workflow JSON files are included in the `examples/` folder:

| File | Description |
|------|-------------|
| `midjourney-imagine.json` | Generate an image with Midjourney — demonstrates the `imagine` operation with prompt and wait |
| `kling-image-to-video.json` | Turn an image into a video with Kling — imageToVideo with model selection |
| `runway-generate-video.json` | Generate a video with Runway Gen-4 Turbo |
| `pixverse-create-video.json` | Create a video with PixVerse — text-to-video with style options |
| `minimax-create-video.json` | MiniMax video generation with subject/scene prompt |

To import: **n8n → Workflows → Import from file** → select any `.json` from `examples/`.

---

## Quick Start

1. Install the package in your n8n instance:
   ```
   npm install n8n-nodes-useapi
   ```
   Or via n8n Settings → Community Nodes → Install → `n8n-nodes-useapi`

2. Add a **UseAPI** credential with your [useapi.net](https://useapi.net) API key

3. Drop the **UseAPI** node into a workflow, select a Resource and Operation

4. Connect to a Manual Trigger or HTTP Webhook and run

---

## Architecture

```
credentials/UseApiCredentials.ts   — API key credential
nodes/UseApi/
  UseApi.node.ts                   — Main node: 10 resources, 150+ operations
  fields/
    midjourney.ts   — Midjourney field definitions
    dreamina.ts     — Dreamina field definitions
    kling.ts        — Kling field definitions
    runway.ts       — Runway field definitions
    pixverse.ts     — PixVerse field definitions
    minimax.ts      — MiniMax field definitions
    insightfaceswap.ts
    googleFlow.ts
    mureka.ts
    tempolor.ts
  options.ts        — Resource dropdown options
```

---

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for the full history.

### Highlights
- **v0.5.9** — Example workflow validation (all types confirmed correct); SUMMARY.md added
- **v0.5.7** — 4 additional example workflows; PUBLISH.md; CHANGELOG.md
- **v0.5.5** — Authorization header sanitization; `required: true` on API key
- **v0.5.4** — Midjourney blend field format fixed to `imageUrl_1..5`
- **v0.5.3** — MiniMax binary uploadFile; TemPolor 3 operations; Midjourney describe fix
- **v0.5.1** — 22 API parameter naming bugs fixed (camelCase → snake_case)
- **v0.5.0** — ESLint v9 migration to flat config
- **v0.4.7** — Kling 3.0 support; MiniMax T2V-2.3, I2V-2.3, Veo-3.1 models
- **v0.4.5** — Midjourney sref/cref parameter mapping fixed; PixVerse negative_prompt fixed

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). PRs welcome — especially keeping operation parameters in sync as useapi.net updates their API.

## License

MIT
