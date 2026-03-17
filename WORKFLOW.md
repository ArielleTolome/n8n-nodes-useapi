# Development Workflow

## Rule: Every Update → GitHub → Release

After every meaningful change to this repo:

1. **Commit** with a descriptive message
2. **Push** to `origin main`
3. **Bump version** in `package.json` (semver: patch for fixes, minor for new features)
4. **Create a GitHub release** with tag matching version (e.g. `v0.1.0`)
   ```bash
   gh release create v0.1.0 --title "v0.1.0 - Initial release" --notes "..."
   ```
5. Continue working

## Release Notes Format
- List new resources/operations added
- List bugs fixed
- List breaking changes (if any)

## Version Strategy
- `0.x.x` — pre-stable, active development
- `1.0.0` — first stable release ready for npm publish
