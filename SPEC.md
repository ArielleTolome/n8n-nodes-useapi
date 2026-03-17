# n8n-nodes-useapi — Full Implementation Spec

## Overview
useapi.net is a $15/month subscription API wrapping AI services behind a unified REST interface.
- Base URL: `https://api.useapi.net/v1`
- Auth: `Authorization: Bearer {apiToken}` on all requests
- Pattern: POST to create job → returns `jobid` → poll GET `/{jobid}` until `status === "completed"`

---

## Package Structure

```
n8n-nodes-useapi/
├── package.json
├── tsconfig.json
├── gulpfile.js
├── .eslintrc.js
├── .prettierrc
├── .npmignore
├── README.md
├── SPEC.md
├── WORKFLOW.md
├── credentials/
│   └── UseApiCredentials.credentials.ts
└── nodes/
    └── UseApi/
        ├── UseApi.node.ts
        ├── UseApiDescription.ts
        └── GenericFunctions.ts
```

---

## Credentials: UseApiCredentials.credentials.ts
- Name: `useApiCredentials`
- Display name: `UseAPI Credentials`
- Field: `apiToken` (string, typeOptions: password)
- Test: GET `https://api.useapi.net/v1/midjourney/accounts`

---

## GenericFunctions.ts

### `useApiRequest(this, method, endpoint, body?, qs?)`
- Adds `Authorization: Bearer {apiToken}` header
- Returns parsed JSON response
- Throws `NodeApiError` on non-2xx

### `waitForJob(this, pollEndpoint, options?)`
Options:
- `intervalMs`: default 3000
- `maxWaitMs`: default 300000 (5 min)
- `statusField`: default "status"
- `completedValue`: default "completed"
- `failedValue`: default "failed"

Behavior:
- Poll every `intervalMs`
- If `status === completedValue` → return full response
- If `status === failedValue` → throw with `error` or `errorDetails` field from response
- If timeout exceeded → throw timeout error

---

## package.json

```json
{
  "name": "n8n-nodes-useapi",
  "version": "0.1.0",
  "description": "n8n community nodes for useapi.net - AI services API (Midjourney, Dreamina, Kling, Runway, PixVerse, MiniMax, InsightFaceSwap)",
  "keywords": [
    "n8n-community-node-package", "n8n", "useapi", "midjourney",
    "dreamina", "kling", "runway", "pixverse", "minimax", "ai",
    "image-generation", "video-generation"
  ],
  "license": "MIT",
  "homepage": "https://github.com/ArielleTolome/n8n-nodes-useapi",
  "author": { "name": "Ariel" },
  "repository": { "type": "git", "url": "git+https://github.com/ArielleTolome/n8n-nodes-useapi.git" },
  "main": "index.js",
  "scripts": {
    "build": "tsc && gulp build:icons",
    "dev": "tsc --watch",
    "format": "prettier nodes credentials --write",
    "lint": "eslint nodes credentials package.json",
    "lintfix": "eslint nodes credentials package.json --fix",
    "prepublishOnly": "npm run build && npm run lint -w"
  },
  "files": ["dist"],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": ["dist/credentials/UseApiCredentials.credentials.js"],
    "nodes": ["dist/nodes/UseApi/UseApi.node.js"]
  },
  "devDependencies": {
    "@types/express": "^4.17.6",
    "@types/request-promise-native": "^1.0.18",
    "eslint-plugin-n8n-nodes-base": "^1.11.0",
    "n8n-workflow": "*",
    "typescript": "^5.1.6",
    "gulp": "^4.0.2"
  },
  "peerDependencies": {
    "n8n-workflow": "*"
  }
}
```

---

## Resources & Operations

### Resource: Midjourney (`/v1/midjourney`)

**imagine** — POST `/jobs/imagine`
- `prompt` (string, required)
- `account` (string, optional)
- `replyUrl` (string, optional) — webhook URL
- `replyRef` (string, optional) — custom reference passed back in webhook
- `waitForCompletion` (boolean, default: true) — poll GET `/jobs/{jobid}`

**button** — POST `/jobs/button`
- `jobid` (string, required) — parent job ID
- `button` (string, required) — e.g. "U1", "U2", "U3", "U4", "V1", "V2", "V3", "V4", "Upscale (2x)", "Upscale (4x)", "Vary (Strong)", "Vary (Subtle)", "Zoom Out 2x", "Zoom Out 1.5x", "Make Square", "🔄"
- `account` (string, optional)
- `replyUrl` (string, optional)
- `waitForCompletion` (boolean, default: true)

**describe** — POST `/jobs/describe`
- `url` (string, optional) — image URL to describe
- `account` (string, optional)
- `replyUrl` (string, optional)
- `waitForCompletion` (boolean, default: true)

**blend** — POST `/jobs/blend`
- `replyUrls` (string, required) — comma-separated image URLs (2-5 images)
- `dimensions` (options: "Portrait", "Square", "Landscape", optional)
- `account` (string, optional)
- `replyUrl` (string, optional)
- `waitForCompletion` (boolean, default: true)

**seed** — POST `/jobs/seed`
- `jobid` (string, required) — get seed value for a completed job
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**settings** — POST `/jobs/settings`
- `account` (string, optional)
- `payload` (JSON string, optional) — settings object to apply (raw JSON field)

**remix** — POST `/jobs/remix`
- `jobid` (string, required)
- `prompt` (string, required) — new prompt for remix
- `button` (string, required) — which variation button to remix e.g. "V1"
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**variability** — POST `/jobs/variability`
- `jobid` (string, required)
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**getJob** — GET `/jobs/{jobid}`
- `jobid` (string, required)

**listJobs** — GET `/jobs`
- `account` (string, optional)
- `status` (options: "created", "started", "moderated", "completed", "failed", optional)

**cancelJob** — DELETE `/jobs/{jobid}`
- `jobid` (string, required)

**listAccounts** — GET `/accounts`

---

### Resource: Dreamina (`/v1/dreamina`)

**generateImage** — POST `/images`
- `prompt` (string, required)
- `model` (options: "seedream-5.0-lite", "seedream-4.6", "seedream-4.5", "seedream-4.1", "seedream-4.0", "nano-banana", "seedream-3.0", default: "seedream-4.0")
- `ratio` (options: "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9", "9:21", default: "1:1")
- `resolution` (options: "2k", "1k", "auto", default: "2k")
- `seed` (number, optional) — for reproducibility
- `imageRef_1` (string, optional) — assetRef from previous image (image-to-image reference)
- `imageRef_2` (string, optional)
- `imageRef_3` (string, optional)
- `account` (string, optional)
- `replyUrl` (string, optional)
- `waitForCompletion` (boolean, default: true) — poll GET `/images/{jobid}`

**generateVideo** — POST `/videos`
- `prompt` (string, required)
- `model` (options: "seedance-2.0", "seedance-1.5-pro", "seedance-1.0-mini", default: "seedance-2.0")
- `ratio` (options: "16:9", "9:16", "1:1", default: "16:9")
- `duration` (options: 5, 10, default: 5)
- `firstFrameRef` (string, optional) — assetRef to use as first frame
- `account` (string, optional)
- `replyUrl` (string, optional)
- `waitForCompletion` (boolean, default: true) — poll GET `/videos/{jobid}`

**upscaleImage** — POST `/images/upscale`
- `jobid` (string, required) — source image job ID
- `imageIndex` (number, default: 0)
- `resolution` (options: "4k", "2k", default: "4k")
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**getImageJob** — GET `/images/{jobid}`
- `jobid` (string, required)

**getVideoJob** — GET `/videos/{jobid}`
- `jobid` (string, required)

**listAssets** — GET `/assets/{account}`
- `account` (string, required)
- `count` (number, optional, default 20, max 100)
- `offset` (number, optional) — pagination cursor

**deleteAsset** — DELETE `/assets/{assetId}`
- `assetId` (string, required)

**cancelJob** — DELETE `/scheduler/{jobid}`
- `jobid` (string, required)

**addAccount** — POST `/accounts`
- `email` (string, required)
- `password` (string, required, typeOptions: password)
- `region` (options: "US", default: "US")
- `dryRun` (boolean, optional) — verify only, don't save

**getAccount** — GET `/accounts/{account}`
- `account` (string, required) — also claims daily credits

**listAccounts** — GET `/accounts`

**deleteAccount** — DELETE `/accounts/{account}`
- `account` (string, required)

---

### Resource: Kling (`/v1/kling`)

**textToVideo** — POST `/videos/text2video`
- `prompt` (string, required)
- `negative_prompt` (string, optional)
- `model` (options: "kling-v3", "kling-o1", "kling-v2.6", "kling-v2.5", "kling-v2.1", "kling-v2.0", "kling-v1.6", "kling-v1.5", default: "kling-v2.6")
- `mode` (options: "std", "pro", "master", default: "std")
- `aspect_ratio` (options: "16:9", "9:16", "1:1", default: "16:9")
- `duration` (options: "5", "10", default: "5")
- `cfg_scale` (number, optional, 0-1, default: 0.5)
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true) — poll GET `/tasks/{task_id}`

**imageToVideo** — POST `/videos/omni`
- `prompt` (string, optional)
- `negative_prompt` (string, optional)
- `image_url` (string, required) — input image URL
- `tail_image_url` (string, optional) — last frame image URL
- `model` (same options as textToVideo, default: "kling-v2.6")
- `mode` (options: "std", "pro", "master", default: "std")
- `duration` (options: "5", "10", default: "5")
- `cfg_scale` (number, optional)
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**imageToVideoEffects** — POST `/videos/image2video-effects`
- `image_url` (string, required)
- `effect_id` (string, required) — from GET /videos/effects
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**extendVideo** — POST `/videos/extend`
- `task_id` (string, required) — source video task ID
- `prompt` (string, optional)
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**lipSync** — POST `/videos/lipsync`
- `task_id` (string, required) — source video task ID
- `audio_url` (string, optional)
- `text` (string, optional) — text for TTS lipsync
- `voice_id` (string, optional) — from GET /elements/voices
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**addSound** — POST `/videos/add-sound`
- `task_id` (string, required)
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**motionCreate** — POST `/videos/motion-create`
- `image_url` (string, required)
- `motion_id` (string, required) — from GET /videos/motions
- `model` (options: "kling-v3", "kling-v2.6", default: "kling-v2.6")
- `duration` (options: "5", "10", default: "5")
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**textToImage** — POST `/images/kolors`
- `prompt` (string, required)
- `negative_prompt` (string, optional)
- `aspect_ratio` (options: "1:1", "16:9", "9:16", "4:3", "3:4", default: "1:1")
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**omniImage** — POST `/images/omni`
- `prompt` (string, required)
- `image_url` (string, optional) — for image-to-image
- `model` (options: "kling-v3", "kling-o1", default: "kling-v3")
- `aspect_ratio` (options: "1:1", "16:9", "9:16", "4:3", "3:4", default: "1:1")
- `resolution` (options: "1k", "2k", "4k", default: "1k")
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**virtualTryOn** — POST `/images/virtual-try-on`
- `human_image_url` (string, required)
- `cloth_image_url` (string, required)
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**recognizeFaces** — POST `/images/recognize-faces`
- `image_url` (string, required)
- `account` (string, optional)

**upscaleImage** — POST `/images/upscale`
- `task_id` (string, required)
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**textToSpeech** — POST `/tts/create`
- `text` (string, required)
- `voice_id` (string, optional) — from GET /tts/voices
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**avatarVideo** — POST `/avatars/video`
- `avatar_id` (string, required) — from GET /avatars
- `text` (string, optional) — TTS text
- `audio_url` (string, optional) — or provide audio
- `voice_id` (string, optional)
- `mode` (options: "std", "pro", default: "std")
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**getTask** — GET `/tasks/{task_id}`
- `task_id` (string, required)

**listTasks** — GET `/tasks`
- `account` (string, optional)

**cancelTask** — DELETE `/scheduler/{task_id}`
- `task_id` (string, required)

**listEffects** — GET `/videos/effects`

**listMotions** — GET `/videos/motions`

**listAvatars** — GET `/avatars`

**listTtsVoices** — GET `/tts/voices`

**uploadAsset** — POST `/assets`
- `url` (string, required) — URL of asset to upload to Kling

**listAssets** — GET `/assets`

**listAccounts** — GET `/accounts`

---

### Resource: Runway (`/v1/runwayml`)

**createVideo** — POST `/videos/create`
- `prompt` (string, required)
- `model` (options: "gen4_turbo", "gen4", "gen3a_turbo", default: "gen4_turbo")
- `ratio` (options: "1280:768", "768:1280", "1104:832", "832:1104", "960:960", "1584:672", default: "1280:768")
- `duration` (options: 5, 10, default: 5)
- `image_url` (string, optional) — for image-to-video
- `seed` (number, optional)
- `exploreMode` (boolean, optional) — unlimited plan only, free generation
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true) — poll GET `/videos/{jobid}`

**createImage** — POST `/images/create`
- `prompt` (string, required)
- `model` (options: "gen4_image", default: "gen4_image")
- `ratio` (options: "1:1", "16:9", "9:16", "4:3", "3:4", default: "1:1")
- `seed` (number, optional)
- `exploreMode` (boolean, optional)
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**lipSync** — POST `/lipsync/create`
- `video_url` (string, required) — source video URL or job URL
- `audio_url` (string, optional)
- `text` (string, optional)
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**actTwo** — POST `/gen4/act-two`
- `video_url` (string, required)
- `reference_url` (string, required) — reference video for motion transfer
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**frames** — POST `/frames/create`
- `prompt` (string, required)
- `image_url` (string, optional)
- `last_frame_url` (string, optional)
- `model` (options: "gen4_turbo", default: "gen4_turbo")
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**getJob** — GET `/videos/{jobid}`
- `jobid` (string, required)

**listAccounts** — GET `/accounts`

---

### Resource: PixVerse (`/v1/pixverse`)

**createVideo** — POST `/videos/create-v4`
- `prompt` (string, required)
- `negative_prompt` (string, optional)
- `model` (options: "v5.6", "v5.5", "v5", "v5-fast", default: "v5.6")
- `aspect_ratio` (options: "16:9", "9:16", "1:1", "4:3", "3:4", default: "16:9")
- `duration` (options: 5, 8, default: 5)
- `quality` (options: "540p", "720p", "1080p", default: "720p")
- `seed` (number, optional)
- `image_url` (string, optional) — for image-to-video
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true) — poll GET `/videos/{jobid}`

**createImage** — POST `/images/create`
- `prompt` (string, required)
- `negative_prompt` (string, optional)
- `model` (options: "seedream-v3", "nano-banana", "qwen-vl", default: "seedream-v3")
- `aspect_ratio` (options: "1:1", "16:9", "9:16", "4:3", "3:4", default: "1:1")
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**extendVideo** — POST `/videos/extend-v4`
- `jobid` (string, required) — source video job ID
- `prompt` (string, optional)
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**upscaleVideo** — POST `/videos/upscale`
- `jobid` (string, required)
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**lipSync** — POST `/videos/lipsync`
- `jobid` (string, required)
- `audio_url` (string, optional)
- `text` (string, optional)
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**modifyVideo** — POST `/videos/modify`
- `jobid` (string, required)
- `prompt` (string, required)
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**getJob** — GET `/videos/{jobid}`
- `jobid` (string, required)

**listAccounts** — GET `/accounts`

---

### Resource: MiniMax (`/v1/minimax`)

**createVideo** — POST `/videos/create`
- `prompt` (string, required)
- `model` (options: "hailuo-02", "hailuo-01-pro", "hailuo-01", "hailuo-01-live2d", "veo-3", "sora-2", "hailuo-mj", default: "hailuo-02")
- `resolution` (options: "1080p", "720p", "480p", default: "1080p")
- `duration` (options: 6, 9, default: 6)
- `image_url` (string, optional) — for image-to-video
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true) — poll GET `/videos/{jobid}`

**createImage** — POST `/images/create`
- `prompt` (string, required)
- `model` (options: "hailuo-mj", "midjourney", "gemini-image", "gpt-image", "seedream", default: "hailuo-mj")
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true) — poll GET `/images/{jobid}`

**createMusic** — POST `/music/create`
- `prompt` (string, required)
- `lyrics` (string, optional)
- `instrumental` (boolean, optional)
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true)

**getVideoJob** — GET `/videos/{jobid}`
- `jobid` (string, required)

**getImageJob** — GET `/images/{jobid}`
- `jobid` (string, required)

**listAccounts** — GET `/accounts`

---

### Resource: InsightFaceSwap (`/v1/faceswap`)

**swapFace** — POST `/jobs/swapface`
- `target` (string, required) — target image URL
- `source` (string, required) — source face image URL
- `account` (string, optional)
- `waitForCompletion` (boolean, default: true) — poll GET `/jobs/{jobid}`

**getJob** — GET `/jobs/{jobid}`
- `jobid` (string, required)

**listAccounts** — GET `/accounts`

---

## Implementation Notes

1. Import types from `n8n-workflow`: `IExecuteFunctions`, `INodeExecutionData`, `INodeType`, `INodeTypeDescription`, `NodeApiError`, `NodeOperationError`
2. All async job operations: return immediately if `waitForCompletion=false`, otherwise call `waitForJob()`
3. `waitForJob` must handle different polling endpoints per service (pass full path)
4. `blend` operation: split comma-separated `replyUrls` string into array before sending
5. Kling uses `task_id` in responses; all others use `jobid` — handle both in `waitForJob`
6. For Kling polling endpoint is `/tasks/{task_id}`, for most others it's `/{resource}/{jobid}`
7. ALL field definitions in `UseApiDescription.ts`, imported by main node
8. Add JSDoc to all exported functions
9. `gulpfile.js` must copy SVG icon to dist

## SVG Icon (useapi.svg)
Create a simple SVG placeholder: a dark circle with "UA" text in white.

## README.md
Include:
- Installation instructions (n8n Community Nodes UI + manual)
- Quick start with credential setup
- Full table of all resources and operations
- Link to useapi.net docs

## .npmignore
Exclude: `src/`, `*.ts`, `tsconfig.json`, `.eslintrc.js`, `node_modules/`, `.git/`

## After building:
1. Run `npm install` to verify package.json is valid
2. Commit everything with message "feat: initial implementation - 7 resources, full API coverage"
3. Push to origin main
4. Create GitHub release v0.1.0:
   ```
   gh release create v0.1.0 --title "v0.1.0 - Initial Release" --notes "Full implementation of useapi.net n8n nodes. Resources: Midjourney, Dreamina, Kling, Runway, PixVerse, MiniMax, InsightFaceSwap. All operations including optional features."
   ```
5. Run: `openclaw system event --text "Done: n8n-nodes-useapi v0.1.0 built, pushed, and released on GitHub" --mode now`
