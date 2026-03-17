# Build n8n-nodes-useapi

> **Status:** Complete
> **Created:** 2026-03-16
> **Updated:** 2026-03-16

## Objective

Build a production-quality n8n community node package for useapi.net covering all 7 AI service integrations with full operation and optional field coverage.

## Requirements

- [x] `UseApiCredentials.credentials.ts` — Bearer token credential with test endpoint
- [x] `GenericFunctions.ts` — `useApiRequest()` and `waitForJob()` helpers
- [x] `UseApiDescription.ts` — ALL field definitions for all 7 resources
- [x] `UseApi.node.ts` — main node routing to all resources/operations
- [x] `package.json` — valid n8n community node package config
- [x] `tsconfig.json` — TypeScript config
- [x] `gulpfile.js` — icon copy to dist
- [x] `useapi.svg` — node icon
- [x] `README.md` — install instructions + operation table
- [x] `.npmignore` — exclude src from npm publish
- [x] `npm install` runs without errors
- [x] All 7 resources implemented: Midjourney, Dreamina, Kling, Runway, PixVerse, MiniMax, InsightFaceSwap
- [x] All operations per SPEC.md including optional fields
- [x] Commit + push to GitHub
- [x] v0.1.0 GitHub release created

## Success Criteria

- Package installs cleanly as n8n community node
- All 7 resources appear in n8n UI
- Every operation from SPEC.md is present with correct fields
- `waitForCompletion` works correctly (polls until done)
- GitHub release v0.1.0 exists at https://github.com/ArielleTolome/n8n-nodes-useapi

## Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Scaffold package structure + credentials + helpers | Complete |
| 2 | Implement all 7 resource descriptions | Complete |
| 3 | Implement main node routing | Complete |
| 4 | Build config, README, icon | Complete |
| 5 | Commit, push, release v0.1.0 | Complete |

## Constraints

- Use SPEC.md as the source of truth for all operations and fields
- Follow docs/ai/context.md coding conventions
- Never inline field definitions in UseApi.node.ts — all go in UseApiDescription.ts
- Tabs for indentation
