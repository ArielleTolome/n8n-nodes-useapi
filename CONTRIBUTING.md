# Contributing

## Development Setup

1. Clone the repo
2. `npm install`
3. `npm run build` — compiles TypeScript to dist/

## Adding a New Node

Follow the pattern of existing nodes. Every node should have:
- Operation selector
- Model dropdown (when applicable)
- Core required fields
- Optional: seed, negativePrompt, ratio/resolution
- replyUrl, replyRef (webhook callbacks)
- captchaToken
- waitForCompletion boolean
- queryTaskStatus operation

## Submitting Changes

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Run `npm run build` — must pass with 0 errors
5. Submit a PR

## Model IDs

Model IDs follow the format: `namespace/version-type`
Examples: `seedream/4.5-text-to-image`, `hailuo/02-text-to-video-pro`
