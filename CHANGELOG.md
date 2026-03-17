# Changelog

All notable changes to this project will be documented in this file.

Format: [Semantic Versioning](https://semver.org/)

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
