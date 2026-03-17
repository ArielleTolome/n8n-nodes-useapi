# n8n-nodes-useapi

n8n community nodes for [useapi.net](https://useapi.net) — a unified REST API for AI video, image, and creative services including Midjourney, Dreamina, Kling, Runway, PixVerse, MiniMax, InsightFaceSwap, and Google Flow.

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
| **Dreamina** | Generate Image, Generate Video, Upscale Image, Get Image Job, Get Video Job, List Assets, Delete Asset, Cancel Job, Add Account, Get Account, List Accounts, Delete Account |
| **Kling** | Text to Video, Image to Video, Image to Video Effects, Extend Video, Lip Sync, Add Sound, Motion Create, Text to Image (KOLORS), Omni Image, Virtual Try On, Recognize Faces, Upscale Image, Text to Speech, Avatar Video, Get Task, List Tasks, Cancel Task, List Effects, List Motions, List Avatars, List TTS Voices, Upload Asset, List Assets, List Accounts |
| **Runway** | Create Video, Create Image, Lip Sync, Act Two, Frames, Get Job, List Accounts |
| **PixVerse** | Create Video, Create Image, Extend Video, Upscale Video, Lip Sync, Modify Video, Get Job, List Accounts |
| **MiniMax** | Create Video, Create Image, Create Music, Get Video Job, Get Image Job, List Accounts |
| **InsightFaceSwap** | Swap Face, Get Job, List Accounts |
| **Google Flow** | Generate Video, Concatenate Videos, Extend Video, GIF to Video, Upscale Video, Generate Image, Upscale Image, Get Job, List Assets, List Accounts, Configure Captcha |

## Async Job Handling

Most AI operations are asynchronous. Each creation operation has a **Wait for Completion** toggle (enabled by default) that automatically polls the job status until it completes or fails.

- **Polling interval:** 3 seconds
- **Timeout:** 5 minutes (300 seconds)
- **On failure:** Throws an error with the failure message

Disable **Wait for Completion** to get the initial job response immediately, then use the corresponding **Get Job/Task** operation to check status manually.

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
| v0.2.3 | Fix Runway model values and field names (text_prompt, aspect_ratio) |
| v0.2.2 | Fix Runway createImage params |
| v0.2.1 | Add prepare script for GitHub installs |
| v0.2.0 | Add Google Flow resource (Veo 3, Imagen 4, Nano Banana, assets, jobs) |
| v0.1.0 | Initial release — 7 resources |

## License

MIT
