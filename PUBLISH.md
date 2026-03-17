# Publishing to n8n Community Nodes

This document outlines the process for publishing and optionally getting this node verified by n8n.

## Current Status

This package is already published to npm as `n8n-nodes-useapi`. Users can install it on self-hosted n8n instances via the GUI or CLI.

---

## Distribution Channels

### 1. npm Registry (Current — Unverified)

Unverified community nodes are installable by self-hosted n8n users:

- **GUI install:** Settings → Community Nodes → Install → enter `n8n-nodes-useapi`
- **CLI install:** `npm install n8n-nodes-useapi` in the n8n data directory

> ⚠️ Unverified community nodes are **not available on n8n Cloud**.

---

### 2. n8n Verified Community Nodes (Optional Upgrade)

Verified nodes appear in the n8n nodes panel and are discoverable by all users (including n8n Cloud).

#### Requirements for Verification

- [ ] Package name starts with `n8n-nodes-` ✅ (`n8n-nodes-useapi`)
- [ ] `n8n-community-node-package` in package.json keywords ✅
- [ ] Nodes and credentials listed in the `n8n` attribute of package.json ✅
- [ ] Passes `npm run lint` with 0 warnings ✅
- [ ] Built with or conforms to `n8n-node` CLI tool scaffolding
- [ ] No run-time npm dependencies (verified nodes restriction)
- [ ] Follows [n8n UX Guidelines](https://docs.n8n.io/creating-nodes/build/reference/ux-guidelines/)
- [ ] Follows [n8n Verification Guidelines](https://docs.n8n.io/creating-nodes/build/reference/verification-guidelines/)
- [ ] Adequate README documentation ✅

#### ⚠️ Important: Provenance Requirement (May 1, 2026)

From **May 1st 2026**, all community nodes submitted for verification **must be published via GitHub Actions** and include an npm provenance statement.

To comply:
1. Publish via the existing GitHub Actions Release workflow (`.github/workflows/release.yml`)
2. Add `--provenance` flag to `npm publish` in the release workflow:
   ```yaml
   - run: npm publish --provenance --access public
   ```
3. Ensure the workflow has `id-token: write` permission for OIDC token generation:
   ```yaml
   permissions:
     id-token: write
     contents: read
   ```

#### Submission Steps

1. Ensure all requirements above are met
2. Publish the package to npm (already done)
3. Sign up or log in to the [n8n Creator Portal](https://creators.n8n.io/nodes)
4. Submit the node for verification review
5. Wait for n8n team review (typically 1–4 weeks)

> Note: n8n reserves the right to reject nodes that compete with n8n's paid/enterprise features.

---

## Publishing a New Version

```bash
# 1. Build and lint
npm run build
npm run lint

# 2. Bump version
npm version patch   # or minor / major

# 3. Push with tags
git push && git push --tags

# 4. GitHub Actions Release workflow auto-publishes to npm on tag push
```

---

## Resources

- [n8n Community Nodes Docs](https://docs.n8n.io/integrations/community-nodes/)
- [Building Community Nodes](https://docs.n8n.io/integrations/community-nodes/build-community-nodes/)
- [n8n Creator Portal](https://creators.n8n.io/nodes)
- [npm Provenance Statements](https://docs.npmjs.com/generating-provenance-statements)
- [n8n UX Guidelines](https://docs.n8n.io/creating-nodes/build/reference/ux-guidelines/)
- [n8n Verification Guidelines](https://docs.n8n.io/creating-nodes/build/reference/verification-guidelines/)
