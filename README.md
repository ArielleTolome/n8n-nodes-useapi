# n8n-nodes-useapi

n8n community nodes for [useapi.net](https://useapi.net) — a unified REST API for AI video, image, music, and creative services including Midjourney, Dreamina, Kling, Runway, PixVerse, MiniMax, InsightFaceSwap, Google Flow, Mureka, and TemPolor.

> **Note:** The npm package name `n8n-nodes-useapi` is taken by an unrelated package. Install from GitHub (see below).

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

## Prerequisites

- A [useapi.net](https://useapi.net) subscription ($15/month)
- Your API token from the useapi.net dashboard

## Setup

1. In n8n, go to **Credentials > New Credential**
2. Search for **UseAPI Credentials**
3. Paste your API token
4. Click **Save** — credentials are tested automatically against the Midjourney accounts endpoint

## Resources & Operations

| Resource | Operations |
|----------|-----------|
| **Midjourney** | Imagine, Button, Describe, Blend, Seed, Settings, Remix, Variability, Get Job, List Jobs, Cancel Job, List Accounts |
| **Dreamina** | Generate Image, Generate Video, Upscale Image (2K/4K/8K), Get Image Job, Get Video Job, List Assets, Delete Asset, Cancel Job, Add Account, Get Account, List Accounts, Delete Account |
| **Kling** | Text to Video, Image to Video, Image to Video Effects, Extend Video, Lip Sync, Add Sound, Motion Create, Text to Image (KOLORS), Omni Image, Virtual Try On, Recognize Faces, Upscale Image, Text to Speech, Avatar Video, Get Task, List Tasks, Cancel Task, List Effects, List Motions, List Avatars, List TTS Voices, Upload Asset, List Assets, List Accounts |
| **Runway** | Create Video, Create Image, Lip Sync, Act Two, Frames, Get Job, List Accounts, Gen 4.5, Gen 4 Turbo, Gen 4, Gen 4 Upscale, Gen 4 Video, Act Two Voice, Gen 3 Turbo, Gen 3, Super Slow Motion, Transcribe, List Assets |
| **PixVerse** | Create Video, Create Image, Create Frames (multi-keyframe), Extend Video, Modify Video, Lip Sync Video, Upscale Video, Get Job, List Accounts |
| **MiniMax** | Create Video, Create Image, Create Music, Agent, Get Video Job, Get Image Job, List Accounts |
| **InsightFaceSwap** | Swap Face, Get Job, List Accounts |
| **Google Flow** | Generate Image, Upscale Image, Generate Video (Veo 3.1 Fast/Quality/Relaxed), Upscale Video, Extend Video, Create GIF, Concatenate Videos, Get Job, List Jobs, Cancel Job, List Assets, Add Account, Get Account, List Accounts, Delete Account, Configure Captcha |
| **Mureka** | Create Song, Create Advanced Song, Create Instrumental, Generate Lyrics, Text to Speech, List Voices, List Moods & Genres |
| **TemPolor** | Create Song, Create Instrumental, Split Stems, Get Song, Download Song, List Artist Voices |

## Google Flow — Video Generation

Google Flow supports **Veo 3.1** video generation with three speed/quality tiers:

- **Veo 3.1 Fast** — fastest generation, good quality (default)
- **Veo 3.1 Quality** — highest quality, slower
- **Veo 3.1 Fast Relaxed** — balanced speed and quality

The **Generate Video** operation also supports **Subject Reference (S2V)** mode via the **Reference URLs** field — provide one or more reference images to anchor the subject in the generated video.

Additional video operations:
- **Extend Video** — extend the duration of an existing video
- **Upscale Video** — enhance video resolution
- **Create GIF** — convert a video to an animated GIF (synchronous, configurable FPS)
- **Concatenate Videos** — join multiple videos in sequence (synchronous)

## Mureka — AI Music Generation

Mureka is an AI music platform accessible via useapi.net. Supports models V8, O2, V7.6, and V7.5.

Operations:
- **Create Song** — generate a song with AI-written lyrics from a prompt
- **Create Advanced Song** — provide your own structured lyrics (with [Verse], [Chorus] sections)
- **Create Instrumental** — generate music without vocals
- **Generate Lyrics** — generate lyrics only (synchronous, no polling)
- **Text to Speech** — convert text to audio
- **List Voices** / **List Moods & Genres** — discovery endpoints

## TemPolor — AI Music & Audio

TemPolor provides song generation, stem splitting, and artist voice cloning.

Operations:
- **Create Song** — generate a full song (prompt, optional lyrics, style, BPM, duration)
- **Create Instrumental** — instrumental track generation
- **Split Stems** — separate an audio file into individual stems (vocals, drums, bass, etc.)
- **Get Song** / **Download Song** — retrieve job status or download output
- **List Artist Voices** — browse available artist voice models

## Async Job Handling

Most AI operations are asynchronous. Each creation operation has a **Wait for Completion** toggle (enabled by default) that automatically polls the job status until it completes or fails.

- **Polling interval:** 3 seconds
- **Timeout:** 5 minutes (300 seconds)
- **On failure:** Throws an error with the failure message

Disable **Wait for Completion** to get the initial job response immediately, then use the corresponding **Get Job/Task** operation to check status manually.

> **Note:** Create GIF and Concatenate Videos (Google Flow) are synchronous and do not require polling.

## Example: Midjourney Imagine

1. Add the **UseAPI** node to your workflow
2. Select **Midjourney** as the resource
3. Select **Imagine** as the operation
4. Enter your prompt
5. Execute — the node waits for the image to be generated and returns the full result with image URLs

## Links

- [useapi.net Documentation](https://useapi.net/docs)
- [GitHub Repository](https://github.com/ArielleTolome/n8n-nodes-useapi)

## Changelog

| Version | Changes |
|---------|---------|
| v0.3.5 | README: add Mureka, TemPolor, Google Flow video docs; complete changelog |
| v0.3.4 | New resource: TemPolor (Create Song, Instrumental, Split Stems, Get/Download Song, List Artist Voices) |
| v0.3.3 | MiniMax: Agent operation; New resource: Mureka (Create Song, Advanced Song, Instrumental, Generate Lyrics, TTS, List Voices/Moods) |
| v0.3.2 | Dreamina: Upscale Image 2K/4K/8K; PixVerse: Create Frames, Extend Video, Modify Video, Lip Sync Video, Upscale Video |
| v0.3.1 | Google Flow: Generate Video (Veo 3.1), Upscale Video, Extend Video, Create GIF, Concatenate Videos |
| v0.3.0 | Add Runway full coverage (Gen 3/4/4.5/Turbo, Act One/Two, Expand, Slow Motion, Transcribe, Assets) |
| v0.2.3 | Fix Runway model values and field names (text_prompt, aspect_ratio) |
| v0.2.2 | Fix Runway createImage params |
| v0.2.1 | Add prepare script for GitHub installs |
| v0.2.0 | Add Google Flow resource (Veo 3, Imagen 4, Nano Banana, assets, jobs) |
| v0.1.0 | Initial release — 7 resources (Midjourney, Dreamina, Kling, Runway, PixVerse, MiniMax, InsightFaceSwap) |

## License

MIT
