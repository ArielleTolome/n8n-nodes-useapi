# n8n-nodes-useapi — Project Context

## What This Is
An n8n community node package that wraps useapi.net's AI services API, giving n8n users native nodes for Midjourney, Dreamina, Kling, Runway, PixVerse, MiniMax, and InsightFaceSwap.

## Owner
Ariel Tolome — https://github.com/ArielleTolome/n8n-nodes-useapi

## Stack
- **Language:** TypeScript (strict: false, ES2019 target)
- **Framework:** n8n community node SDK (`n8n-workflow` peer dep)
- **Build:** `tsc` + `gulp build:icons`
- **Lint:** `eslint-plugin-n8n-nodes-base`
- **Package name:** `n8n-nodes-useapi`
- **npm keywords must include:** `n8n-community-node-package`

## Key Files
- `credentials/UseApiCredentials.credentials.ts` — single Bearer token credential
- `nodes/UseApi/UseApi.node.ts` — main node with resource/operation routing
- `nodes/UseApi/UseApiDescription.ts` — ALL field definitions (no fields in main node file)
- `nodes/UseApi/GenericFunctions.ts` — `useApiRequest()` and `waitForJob()` helpers
- `SPEC.md` — full API spec with every resource, operation, and field
- `WORKFLOW.md` — git/release rules (every change = push + GitHub release)

## API Details
- Base URL: `https://api.useapi.net/v1`
- Auth: `Authorization: Bearer {apiToken}` on every request
- Pattern: POST → get `jobid` → poll GET `/{jobid}` until `status === "completed"`
- Kling uses `task_id` (not `jobid`), poll endpoint: `/tasks/{task_id}`

## Development Rules
- ALL field definitions go in `UseApiDescription.ts` — never inline in main node
- `waitForJob()` must accept the poll endpoint as a parameter
- Every `waitForCompletion` toggle: false = return raw POST response, true = poll to completion
- Match n8n community node conventions exactly (see existing community nodes for reference)
- Tabs for indentation (TypeScript convention in n8n ecosystem)

## Release Workflow
See WORKFLOW.md — every meaningful change must: commit → push to origin main → `gh release create`

## Resources
- Full API spec: `SPEC.md` (read this before implementing anything)
- useapi.net docs: https://useapi.net/docs
- n8n node dev guide: https://docs.n8n.io/integrations/creating-nodes/
