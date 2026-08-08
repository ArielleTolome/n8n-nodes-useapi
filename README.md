# n8n-nodes-useapi

n8n community nodes for [useapi.net](https://useapi.net) — unified REST API for AI video, image, music, and creative services.

**Package:** `n8n-nodes-useapi-net` · **Current:** v1.0.0 (Aug 2026 UseAPI.net)

## API Version Support (v1.0.0)

| Resource | API | Highlights (Aug 2026) |
|----------|-----|------------------------|
| **Google Flow** *(default)* | v1 `/v1/google-flow` | Images: `nano-banana-2-lite` (default), `nano-banana-2`, `nano-banana-pro`. Video: `veo-3.1-fast/quality/lite`, `omni-flash`. Fields: `aspectRatio`, `count`, `reference_1..10` |
| **Flow Music** | v1 `/v1/flowmusic` | Lyria 3 Pro — create/edit/lyrics/list/download, files, jobs, accounts |
| **Dreamina** | v1 `/v1/dreamina` | Video: `seedance-2.5` (default, up to 30s), `seedance-2.0`/`fast`/`mini`. Image: `seedream-4.7`, `seedream-5.0-lite` |
| **MiniMax** | v1 `/v1/minimax` | Video: `Hailuo-3.0`, `Seedance-2.0`/`Fast`/`Mini`, `02`, `T2V-2.3`, `Veo-3.1`, `Sora-2` + omni file refs |
| **PixVerse** | v2 `/v2/pixverse` | Video v6 + Seedance/Kling/Veo/Sora; images seedream-5.0-pro/lite; **music** + **speech** TTS |
| **Runway** | v1 `/v1/runwayml` | Gen-4.5 + images `nano-banana-2-lite` default |
| Kling | v1 `/v1/kling` | V3 / O1 / 2.x |
| Mureka | v1 `/v1/mureka` | Music + TTS |
| TemPolor | v1 `/v1/tempolor` | Royalty-free music / stems |
| InsightFaceSwap | v1 `/v1/faceswap` | Face swap |
| Midjourney | v3 `/v3/midjourney` | **Discontinued June 24 2026** — kept for legacy jobs |

### Model ID notes
- MiniMax uses exact IDs: `Hailuo-3.0`, `Seedance-2.0`, `02`, `T2V-2.3`, `Veo-3.1`, `Sora-2` (not `hailuo-02`).
- Google Flow image requests send `aspectRatio` + `count` (not `aspect_ratio` / `image_count`).
- Google Flow video maps 16:9→`landscape`, 9:16→`portrait`.

---

## Examples

Import ready-to-use workflow templates from the [`examples/`](./examples/) directory directly into n8n.

---

## Installation

### GitHub Install (Recommended)

For self-hosted n8n running in Docker:

```bash
docker exec -u node n8n sh -c "
  mkdir -p /home/node/.n8n/nodes &&
  cd /home/node/.n8n/nodes &&
  npm install github:ArielleTolome/n8n-nodes-useapi
"
docker restart n8n
```

For self-hosted n8n (bare metal):

```bash
cd ~/.n8n/nodes
npm install github:ArielleTolome/n8n-nodes-useapi
```

Or pin a release:

```bash
npm install github:ArielleTolome/n8n-nodes-useapi#v1.0.0
```

Restart n8n after installation. The nodes will appear in the node picker — search for **UseAPI**.

### npm

```bash
npm i n8n-nodes-useapi-net
```

> Note: the older npm name `n8n-nodes-useapi` is a different package. Prefer `n8n-nodes-useapi-net` or the GitHub install.

---

## Prerequisites

- A [useapi.net](https://useapi.net) subscription ($15/month)
- Your API token from the useapi.net dashboard

---

## Setup

1. In n8n, go to **Credentials > New Credential**
2. Search for **UseAPI Credentials**
3. Paste your API token
4. Click **Save**

---

## Resources & Operations

### Google Flow (default)

Operations: Generate Image, Upscale Image, Generate Video, Extend/Upscale/GIF/Concatenate, Jobs, Assets, Accounts, Captcha providers

Key image params: `model` (`nano-banana-2-lite` default), `aspectRatio`, `count`, `gfImgRefs` → `reference_1..10`

Key video params: `model` (`veo-3.1-fast` / lite / omni-flash), landscape/portrait, multi-modal refs

### Flow Music (Lyria 3 Pro)

Operations: Create Music, Edit Music, Generate Lyrics, List/Download Music, Upload File, Jobs, Accounts, Usage

Connect accounts with a Flow Music `refresh_token` (see [Setup Flow Music](https://useapi.net/docs/start-here/setup-flowmusic)).

### Dreamina

Operations: Generate Image, Generate Video, Upscale Image, Jobs, Assets, Accounts

Video: `seedance-2.5` default, resolution 480p/720p/1080p/4k, omni image/video/audio CSV refs

### MiniMax / Hailuo

Operations: Create Video/Image/Music, Agent, Files, Jobs, Accounts

Create Video supports `fileID`, `end_frame_fileID`, `fileID2-9`, `videoFileID1-3`, `audioFileID1-3`, `options`, `aspectRatio`, and independent `resolution`/`duration` for Seedance/H3.

### PixVerse

Operations: Video (create/frames/extend/modify/fusion/lipsync/upscale), Images, **Create Music**, **Create Speech** + voices/models, Accounts, Features

Music models: `music-2.6`, `music-v1`, `lyria-3-pro-preview`  
Speech models: `speech-2.8-hd`, `speech-2.8-turbo`, ElevenLabs v2/v3/turbo

### Midjourney (discontinued)

Legacy v3 ops retained for existing workflows. Prefer Google Flow / Dreamina / MiniMax for new image work.

### Kling / Runway / Mureka / TemPolor / InsightFaceSwap

See node operation lists in the n8n UI. Runway images default to `nano-banana-2-lite`.

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for full history. Recent:

- **v1.0.0** — Docs/README sync, E2E verification, stable Aug 2026 API surface
- **v0.9.0** — Flow Music + PixVerse music/speech
- **v0.8.0** — Model catalogs + MiniMax/Google Flow/Dreamina field mapping

---

## License

MIT
