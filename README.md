# n8n-nodes-useapi

n8n community nodes for [useapi.net](https://useapi.net) — a unified REST API for AI video, image, music, and creative services including Midjourney, Dreamina, Kling, Runway, PixVerse, MiniMax, InsightFaceSwap, Google Flow, Mureka, and TemPolor.

> **Note:** The npm package name `n8n-nodes-useapi` is taken by an unrelated package. Install from GitHub (see below).

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

Restart n8n after installation. The nodes will appear in the node picker — search for **UseAPI**.

### Manual (npm not available due to name conflict)

The name `n8n-nodes-useapi` on npm points to a different, unrelated package. Use the GitHub install method above.

---

## Prerequisites

- A [useapi.net](https://useapi.net) subscription ($15/month)
- Your API token from the useapi.net dashboard

---

## Setup

1. In n8n, go to **Credentials > New Credential**
2. Search for **UseAPI Credentials**
3. Paste your API token
4. Click **Save** — credentials are tested automatically against the Midjourney accounts endpoint

---

## Resources & Operations

### 🎨 Midjourney

Operations: Imagine, Button, Describe, Blend, Seed, Settings, Remix, Variability, Get Job, List Jobs, Cancel Job, List Accounts

Key parameters:
- `prompt` — image prompt text
- `sref` — style reference URL for style consistency
- `cref` — character reference URL for character consistency
- `account` — specific account to use
- `replyUrl` / `replyRef` — webhook callback and custom reference
- `captchaToken` / `captchaRetry` / `captchaOrder` — CAPTCHA handling
- `waitForCompletion` — poll until complete (default: true)

---

### 🎨 Dreamina

Operations: Generate Image, Generate Video, Upscale Image (2K/4K/8K), Get Image Job, Get Video Job, List Assets, Delete Asset, Cancel Job, Add Account, Get Account, List Accounts, Delete Account

Key parameters (Generate Image/Video):
- `prompt`, `imageUrl`
- `model`, `aspectRatio`, `duration`
- `seed`, `negativePrompt`
- `replyUrl` / `replyRef`
- `async` — fire-and-forget mode
- `waitForCompletion`

---

### 🎬 Kling

Operations: Text to Video, Image to Video, Image to Video Effects, Extend Video, Lip Sync, Add Sound, Motion Create, Text to Image (KOLORS), Omni Image, Virtual Try On, Recognize Faces, Upscale Image, Text to Speech, Avatar Video, Get Task, List Tasks, Cancel Task, List Effects, List Motions, List Avatars, List TTS Voices, Upload Asset, List Assets, List Accounts

Key parameters (Video generation):
- `prompt`, `imageUrl`, `endImageUrl`
- `model` — Kling model version (1.6, 2.0, 2.1 series)
- `duration` — 5 or 10 seconds
- `aspectRatio`
- `seed`
- `negativePrompt`
- `replyUrl` / `replyRef`
- `async` — fire-and-forget mode
- `captchaToken`
- `waitForCompletion`

---

### 🎬 Runway

Operations: Create Video, Create Image, Lip Sync, Act Two, Frames, Get Job, List Accounts, Gen 4.5, Gen 4 Turbo, Gen 4, Gen 4 Upscale, Gen 4 Video, Act Two Voice, Gen 3 Turbo, Gen 3, Super Slow Motion, Transcribe, List Assets

Key parameters (Create Video):
- `prompt`, `imageUrl`, `endImageUrl`
- `model` — Gen 3/4/4.5 variant
- `duration`, `aspectRatio`
- `seed`
- `replyUrl` / `replyRef`
- `async`
- `waitForCompletion`

---

### 🎬 PixVerse

Operations: Create Video, Create Image, Create Frames (multi-keyframe), Extend Video, Modify Video, Lip Sync Video, Upscale Video, Get Job, Create Fusion, Create Transition, List LipSync Voices, List Effects, Get/Delete Video, Get/Delete Image, Add/Get/Delete Account, Cancel Job, List Accounts

Key parameters (Create Video):
- `prompt`, `imageUrl`
- `model`, `style`, `duration`, `aspectRatio`
- `negativePrompt` — for Modify Video and standard generation
- `seed`
- `replyUrl` / `replyRef`
- `async`, `captchaToken`
- `waitForCompletion`

---

### 🎬 MiniMax

Operations: Create Video, Create Image, Create Music, Agent, Get Video Job, Get Image Job, List Accounts, Add/Delete Account, Cancel Video, List Agent Templates, List Characters, Upload File

Key parameters (Create Video):
- `prompt`, `imageUrl`
- `model`, `duration`, `aspectRatio`
- `seed`
- `replyUrl` / `replyRef`
- `async`, `waitForCompletion`

---

### 👤 InsightFaceSwap

Operations: Swap Face, Get Job, List Accounts

Key parameters:
- `sourceImageUrl` — image with the source face
- `targetImageUrl` — image where the face will be swapped
- `account`
- `replyUrl` / `replyRef`
- `waitForCompletion`

---

### 🎥 Google Flow

Operations: Generate Image, Upscale Image, Generate Video (Veo 3.1 Fast/Quality/Relaxed), Upscale Video, Extend Video, Create GIF, Concatenate Videos, Get Job, List Jobs, Cancel Job, List Assets, Add Account, Get Account, List Accounts, Delete Account, Configure Captcha

**Video generation supports Veo 3.1 with three tiers:**
- `Veo 3.1 Fast` — fastest generation, good quality (default)
- `Veo 3.1 Quality` — highest quality, slower
- `Veo 3.1 Fast Relaxed` — balanced speed and quality

**Subject Reference (S2V) mode:** provide one or more `referenceUrls` to anchor the subject across frames.

Key parameters (Generate Video):
- `prompt`, `imageUrl`
- `model` — Veo 3.1 tier selection
- `duration`, `aspectRatio`, `resolution`
- `referenceUrls` — subject reference images for S2V
- `endImageUrl` — end frame for image-to-video
- `seed`
- `replyUrl` / `replyRef`
- `async`, `captchaToken`
- `waitForCompletion`

Note: Create GIF and Concatenate Videos are synchronous — no polling required.

---

### 🎵 Mureka

Operations: Create Song, Create Advanced Song, Create Instrumental, Generate Lyrics, Text to Speech, List Voices, List Moods & Genres, Get Song, List Songs, Delete Song, Download Song, Extend Song, Generate Music Video, Add/Get/Delete Account

Models: `V8`, `O2`, `V7.6`, `V7.5`

Key parameters (Create Song):
- `prompt` — lyric/style prompt
- `model` — Mureka model version
- `mood`, `genre`, `bpm`
- `replyUrl` / `replyRef`
- `async`, `waitForCompletion`

Key parameters (Create Advanced Song):
- `lyrics` — structured lyrics with `[Verse]`, `[Chorus]` sections
- `style`, `model`

---

### 🎵 TemPolor

Operations: Create Song, Create Instrumental, Split Stems, Get Song, Download Song, List Artist Voices, Add/Get/Delete Account, Delete Song, Upload/List/Delete MIDI, Clone Voice, List/Delete Cloned Voices

Key parameters (Create Song):
- `prompt` — creative prompt
- `lyrics` — optional custom lyrics
- `style`, `bpm`, `duration`
- `artistVoice` — voice model for singing
- `replyUrl` / `replyRef`
- `async`, `waitForCompletion`

Key parameters (Split Stems):
- `audioUrl` — source audio file URL
- `stems` — comma-separated list (vocals, drums, bass, etc.)

---

## Async Job Handling

Most AI operations are asynchronous. Each creation operation has a **Wait for Completion** toggle (enabled by default) that automatically polls the job status until it completes or fails.

- **Polling interval:** 3 seconds
- **Timeout:** 5 minutes (300 seconds)
- **On failure:** Throws an error with the failure message

Disable **Wait for Completion** to get the initial job response immediately, then use the corresponding **Get Job/Task** operation to check status manually.

For immediate fire-and-forget without polling, use the **Async** toggle (where supported) — returns the task ID only.

> **Note:** Create GIF and Concatenate Videos (Google Flow) are synchronous and do not require polling.

---

## Example: Midjourney Imagine

1. Add the **UseAPI** node to your workflow
2. Select **Midjourney** as the resource
3. Select **Imagine** as the operation
4. Enter your prompt (optionally add `sref`/`cref` for style/character references)
5. Execute — the node waits for the image to be generated and returns the full result with image URLs

---

## Links

- [useapi.net Documentation](https://useapi.net/docs)
- [GitHub Repository](https://github.com/ArielleTolome/n8n-nodes-useapi)

---

## Changelog

| Version | Changes |
|---------|---------|
| v0.4.5 | Update README with complete field documentation and changelog |
| v0.4.4 | Final gap-fill — Midjourney sref/cref fields, PixVerse modifyVideo negativePrompt, execute logic verification across all resources |
| v0.4.3 | Add async field to all generation operations + fill remaining model-specific parameter gaps |
| v0.4.2 | Deep-pass — fill execute logic gaps, add async field, verify all optional fields are actually sent in all operations |
| v0.4.1 | Add missing optional fields to all remaining operations across all resources |
| v0.4.0 | Add all missing optional fields to all nodes and operations (seed, negativePrompt, replyUrl, replyRef, captchaToken, endImageUrl) |
| v0.3.9 | TemPolor: Account management, Delete Song, MIDI upload/list/delete, Voice cloning (clone, list, delete); README updated |
| v0.3.8 | MiniMax: Add/Delete Account, Cancel Video, List Agent Templates, List Characters, Upload File; Mureka: Account management, Song management, Generate Music Video |
| v0.3.7 | PixVerse: Create Fusion, Create Transition, List LipSync Voices, List Effects, Get/Delete Video, Get/Delete Image, Account management, Cancel Job |
| v0.3.6 | Kling: Omni Video (O1), Image-to-Video First+Last Frames, Image-to-Video Elements, KOLORS Elements, List Elements/Tags/Voices, Account management |
| v0.3.5 | README: add Mureka, TemPolor, Google Flow video docs |
| v0.3.4 | New resource: TemPolor (Create Song, Instrumental, Split Stems, Get/Download Song, List Artist Voices) |
| v0.3.3 | MiniMax: Agent operation; New resource: Mureka (Create Song, Advanced Song, Instrumental, Generate Lyrics, TTS, List Voices/Moods) |
| v0.3.2 | Dreamina: Upscale Image 2K/4K/8K; PixVerse: Create Frames, Extend Video, Modify Video, Lip Sync Video, Upscale Video |
| v0.3.1 | Google Flow: Generate Video (Veo 3.1), Upscale Video, Extend Video, Create GIF, Concatenate Videos |
| v0.3.0 | Add Runway full coverage (Gen 3/4/4.5/Turbo, Act One/Two, Expand, Slow Motion, Transcribe, Assets) |
| v0.2.2 | Fix Runway model values and field names |
| v0.2.0 | Add Google Flow resource (Veo 3, Imagen 4, Nano Banana, assets, jobs) |
| v0.1.0 | Initial release — 7 resources (Midjourney, Dreamina, Kling, Runway, PixVerse, MiniMax, InsightFaceSwap) |

---

## License

MIT
