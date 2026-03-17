# n8n-nodes-useapi

n8n community nodes for [useapi.net](https://useapi.net) — a unified REST API for AI services including Midjourney, Dreamina, Kling, Runway, PixVerse, MiniMax, and InsightFaceSwap.

## Installation

### Community Nodes (Recommended)

1. Open **Settings > Community Nodes** in your n8n instance
2. Click **Install a community node**
3. Enter `n8n-nodes-useapi`
4. Click **Install**

### Manual Installation

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-useapi
```

Restart n8n after installation.

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

## Async Job Handling

Most AI operations are asynchronous. Each creation operation has a **Wait for Completion** toggle (enabled by default) that automatically polls the job status until it completes or fails.

- **Polling interval**: 3 seconds
- **Timeout**: 5 minutes (300 seconds)
- **On failure**: Throws an error with the failure message

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

## License

MIT
