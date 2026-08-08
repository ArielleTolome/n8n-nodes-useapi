# Changelog

All notable changes to this project will be documented in this file.

Format: [Semantic Versioning](https://semver.org/)

## [1.0.0] - 2026-08-08
### Added
- README fully synced to Aug 2026 UseAPI.net surface (Flow Music, Hailuo-3.0, Seedance-2.5, PixVerse speech/music)
- E2E verification against live Google Flow accounts + `nano-banana-2-lite` image generation

### Changed
- Stable 1.0.0 release line for n8n community install
- Flow Music account connect uses `refresh_token`; download uses `id`; edit uses `clip`

### Verified
- `npm test` (56+ unit tests) + `npm run build` green
- Live GET `/v1/google-flow/accounts` → 200
- Live POST `/v1/google-flow/images` model `nano-banana-2-lite` count=1 → 200 with media URL


## [1.0.1] - 2026-08-08
### Added (changelog gap-fill vs https://useapi.net/docs/changelog)
- **Runway** models: `seedance-2`, `seedance-2-fast`, `grok-imagine-1.5`, `happyhorse-1.0`, Kling O3 (pro/standard/4k), `kling-3.0-motion-control`; image `gpt-image-2` + aspect `auto`
- **Runway** `videoUpscale` (Topaz 4K) + `addAccount` with `useWorkspace` (team billing)
- **Kling** `passToken`/`did`/`userId` account connect (login slider captcha); `kling-v3-0-turbo` model
- **Mureka** durable `email`+`password` account connect (+ refresh_token mode)
- **Google Flow** `getAsset` with `?raw=true`, upload asset, characters + voices CRUD helpers
- **PixVerse** `motionControl`, music get/list, Seedance `2160p` quality tier
- Captcha retry defaults raised toward UseAPI’s 5-attempt default for Flow fields

### Verified
- Full audit against official UseAPI changelog through Aug 7 2026
- `npm run build` + 56 unit tests passing

## [0.9.0] - 2026-08-08
### Added
- **Flow Music** resource (`/v1/flowmusic`): create/edit/lyrics/list/download, files, jobs, accounts, usage
- **PixVerse** `createMusic` + full **speech** ops (create/list/get/voices/models)
- Expanded unit tests for Aug 2026 model catalogs + new resources
- `User-Agent` on outbound UseAPI requests (Cloudflare 1010 mitigation)

### Verified
- Live E2E: Google Flow `nano-banana-2-lite` 9:16 still → HTTP 200 with media URL
- `npm run build` + 56 unit tests passing

## [0.8.0] - 2026-08-08
### Added
- **Flow Music** resource (`/v1/flowmusic`): create/edit/lyrics/list/download, files upload, jobs, accounts, usage
- **PixVerse speech** ops: createSpeech, listSpeechVoices, listSpeechModels, getSpeech, listSpeech
- **PixVerse music** createMusic (`music-2.6`, `music-v1`, `lyria-3-pro-preview`)
- MiniMax **Hailuo-3.0** + **Seedance-2.0/Fast/Mini** models with resolution/duration/options/aspectRatio and omni fileID/video/audio refs
- Google Flow **nano-banana-2-lite** (default), **veo-3.1-lite**, **omni-flash**; correct `aspectRatio`/`count` request fields; reference_1..10 helpers
- Dreamina **seedance-2.5** (up to 30s), seedance-2.0-fast/mini, video resolution + omni image/video/audio refs, seedream-4.7
- PixVerse/Runway latest image & video model catalogs (Seedance, Nano Banana 2 Lite, v6, etc.)
- User-Agent header on API requests (avoids Cloudflare 1010 blocks)

### Changed
- Default resource is now **Google Flow** (Midjourney marked discontinued as of 2026-06-24)
- MiniMax createVideo maps to official UseAPI body shape (`fileID`, `options`, `aspectRatio`, independent `resolution`/`duration`)

### Fixed
- Google Flow image/video parameter naming (`aspectRatio`, `count`) to match live API

## [0.8.0] - 2026-08-08
### Changed
- Default resource is now **Google Flow** (Midjourney labeled discontinued June 24 2026)
- **MiniMax** video models: `Hailuo-3.0`, `Seedance-2.0` / Fast / Mini, correct IDs (`02`, `T2V-2.3`, `Veo-3.1`, `Sora-2`)
- MiniMax createVideo mapping: `fileID`, `end_frame_fileID`, `fileID2-9`, `videoFileID1-3`, `audioFileID1-3`, `options`, `aspectRatio`; resolution/duration only when set
- **Google Flow** images: `nano-banana-2-lite` default; API fields `aspectRatio`, `count`, `reference_1..10`
- Google Flow videos: `veo-3.1-lite`, `veo-3.1-lite-low-priority`, `omni-flash`; landscape/portrait; multi-modal refs
- **Dreamina** video: `seedance-2.5` default (up to 30s), fast/mini, resolution, omni refs; image `seedream-4.7`
- **PixVerse** video catalog (v6 + Seedance/Kling/Veo/Sora/etc.), images seedream-5.0-pro/lite + nano-banana-2-lite; fusion Seedance
- **Runway** image default `nano-banana-2-lite`

## [0.5.9] - 2026-03-17
### Validated
- All 5 example workflow JSON files confirmed valid for n8n import (correct types, required fields, proper UUIDs)
- `n8n-nodes-useapi.useApi` type string verified correct in all examples
### Added
- SUMMARY.md — comprehensive package documentation for first-time discovery

## [0.5.7] - 2026-03-17
### Added
- 4 additional importable n8n workflow example templates: Kling image-to-video, Runway video generation, PixVerse video creation, MiniMax video creation
- CHANGELOG.md (this file)
- PUBLISH.md with n8n community node submission guidance

## [0.5.6] - 2026-03-17
### Added
- Importable n8n workflow example templates in `examples/`
- Examples section in README

## [0.5.5] - 2026-03-17
### Security
- Authorization header sanitization in error messages (prevents token leakage in logs)
- Added `required: true` to API key credential field

## [0.5.4] - 2026-03-17
### Fixed
- Midjourney blend: field format corrected to imageUrl_1/imageUrl_2/imageUrl_3/imageUrl_4/imageUrl_5
### Documentation
- README changelog fully updated through v0.5.3

## [0.5.3] - 2026-03-17
### Added
- Binary upload implementation: MiniMax uploadFile, TemPolor 3 operations
### Fixed
- Midjourney describe: fixed operation parameter mapping

## [0.5.2] - 2026-03-17
### Fixed
- MiniMax agent API: removed non-existent fields, fixed prompt key
- asyncMode: verified across all relevant operations

## [0.5.1] - 2026-03-17
### Fixed
- **22 API parameter naming fixes** across all resources — camelCase → snake_case in request bodies

## [0.5.0] - 2026-03-17
### Changed
- ESLint v10 fix: pinned to ESLint v9, migrated to flat config (eslint.config.mjs)

## [0.4.9] - 2026-03-17
### Changed
- n8n best practices compliance improvements
- TypeScript: fixed Promise<any> types throughout codebase

## [0.4.8] - 2026-03-17
### Added
- GitHub Actions CI workflow (Node 18.x + 20.x)
- GitHub Actions Release workflow (auto-publish on tag)
- CONTRIBUTING.md

## [0.4.7] - 2026-03-17
### Added
- Kling 3.0 sync: generationMode, enableSound, 15s duration support
- MiniMax new models: T2V-2.3, I2V-2.3, Veo-3.1

## [0.4.6] - 2026-03-17
### Added
- GitHub releases created for all prior versions
### Changed
- UX polish: placeholder text on URL fields, normalized descriptions

## [0.4.5] - 2026-03-17
### Fixed
- Midjourney: sref/cref parameter mapping corrected
- PixVerse modifyVideo: negative_prompt field fixed

## [0.4.4] - 2026-03-17
### Fixed
- Confirmed all prior wave fields complete and verified

## [0.4.3] - 2026-03-17
### Added
- asyncMode parameter added to 60+ generation operations across all resources

## [0.4.2] - 2026-03-17
### Added
- Advanced parameters: guidance scale, colorPalette, ttsLanguageCode
- Additional optional fields across video generation resources

## [0.4.1] - 2026-03-17
### Added
- replyUrl, replyRef, captchaToken, seed, negativePrompt across all resources
- Style options, modelVersion dropdowns

## [0.4.0] - 2026-03-17
### Added
- Initial major field expansion: startFrame/endFrame, seed, and all optional fields across resources

## [0.3.9] - 2026-03-17
### Added
- 429 rate limit retry with exponential backoff in GenericFunctions
- Initial release with Midjourney, Kling, Runway, PixVerse, MiniMax resources
