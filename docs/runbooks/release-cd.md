# Release CD Runbook

## TL;DR

Use one GitHub Actions workflow to release both artifacts from the same commit:

1. Publish `rxjs-monitor` to npm.
2. Build, zip, and publish the Chrome extension.

Workflow file: `.github/workflows/release.yml`.

## When to use

- You want React apps to consume `monitorRX` from `rxjs-monitor`.
- You want extension releases to stay aligned with npm package releases.
- You want repeatable, auditable releases from CI/CD.

## Release model

1. `main` push with `packages/core/package.json` version change:
   - publishes npm with `next` tag.
   - publishes extension.
2. `release/*` push with `packages/core/package.json` version change:
   - publishes npm with `latest` tag.
   - publishes extension.
3. `v*` tag push:
   - ensures npm `latest` points to that version.
   - does not publish extension again (avoids duplicate extension publish).

## Step-by-step implementation

### Step 1: Define one source of truth for version

Use `packages/core/package.json` (`rxjs-monitor`) as the release version source.

Current example:

```json
{
  "name": "rxjs-monitor",
  "version": "0.1.0"
}
```

### Step 1.1: Use the workspace bump scripts

Bump from repo root using the existing scripts:

```bash
pnpm bump:patch
pnpm bump:minor
pnpm bump:major
```

What these do:

1. Update `packages/core/package.json` version.
2. Do not create git tags automatically (`--no-git-tag-version`).
3. Require you to commit the version change in the release PR.

### Step 1.2: Use release scripts when you want git tags

For CD tied to release tags, use:

```bash
pnpm release:patch
pnpm release:minor
pnpm release:major
```

What these do:

1. Update `packages/core/package.json` version.
2. Create a git commit with message `release: rxjs-monitor vX.Y.Z`.
3. Create a git tag `vX.Y.Z`.
4. Fail if the git working tree is not clean.

After running a `release:*` command:

```bash
git push origin main --follow-tags
```

### Step 2: Keep extension version in sync

Before publishing extension, set `apps/extension/manifest.json` `version` to match `packages/core/package.json`.

Current implementation:

1. `pnpm release:patch|minor|major` runs `npm version` in `packages/core`.
2. The `version` lifecycle script in `packages/core` syncs `apps/extension/manifest.json` automatically.
3. For `release:*` (tagging enabled), the script also stages the manifest file so it is included in the release commit/tag.

Alternative options (if you change this later):

1. Commit the manifest version bump in release PRs.
2. Or sync inside CI before extension publish (preferred for automation).

### Step 3: Add required GitHub secrets

Add repository secrets:

1. `NPM_TOKEN`
2. `CWS_EXTENSION_ID`
3. `CWS_PUBLISHER_ID`
4. `CWS_CLIENT_ID`
5. `CWS_CLIENT_SECRET`
6. `CWS_REFRESH_TOKEN`

Notes:

1. npm token must be allowed to publish `rxjs-monitor`.
2. Your npm account currently enforces 2FA rules, so token policy must allow CI publishing.
3. Chrome Web Store credentials must be allowed to upload and publish the target extension.
4. `CWS_EXTENSION_ID` is the extension item ID from the Chrome Web Store URL (the long ID used in `/detail/<name>/<EXTENSION_ID>`).

### Step 4: Add release workflow

Trigger:

1. `push` on `main`
2. `push` on `release/**`
3. `push` on tags `v*`
4. `workflow_dispatch`

Jobs:

1. `verify`:
   - checkout
   - setup node + pnpm
   - `pnpm install --frozen-lockfile`
   - `pnpm verify`
2. `publish_npm`:
   - needs `verify`
   - only run if package version changed
   - `npm publish` from `packages/core` when version is new
   - always enforces the configured dist-tag (`next` or `latest`) with `npm dist-tag add`
3. `publish_extension`:
   - needs `publish_npm`
   - build extension
   - zip build output
   - upload + publish via Chrome Web Store API using `scripts/release/publish-extension.mjs`

### Step 5: Gate releases by version change

Avoid publishing on every push.

In workflow logic, compare previous and current `packages/core/package.json` version.

If unchanged:

1. skip npm publish
2. skip extension publish

For tag-triggered releases (`refs/tags/v*`), release is always enabled and `latest` is enforced.

### Step 6: Automate npm dist-tags (`latest`/`next`)

Current behavior in workflow:

1. `main` uses npm tag `next`.
2. `release/*` and `v*` tags use npm tag `latest`.
3. `npm dist-tag add rxjs-monitor@<version> <tag>` runs even when version already exists, so `latest` can be promoted automatically.

### Step 7: Build and package extension

Use:

```bash
pnpm --filter @rxjs-devtools/extension build
```

Then zip extension payload (manifest + built assets) for Chrome Web Store upload.

### Step 8: Publish extension via API

Use Chrome Web Store API upload and publish endpoints from CI.

Current implementation:

1. `scripts/release/publish-extension.mjs` fetches OAuth token from `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`.
2. Uploads the extension zip to Chrome Web Store API v2 upload endpoint.
3. Polls status when upload is asynchronous.
4. Submits publish request to Chrome Web Store API v2 publish endpoint.

### Step 9: Add concurrency and environment protection

In release workflow:

1. use `concurrency` per branch to avoid duplicate releases.
2. use a protected GitHub Environment (for example `production`) for extension publish.
3. require manual approval for production environment if desired.

### Step 10: Add rollback and recovery rules

Document these rules in the workflow or repo docs:

1. If npm publish succeeds and extension publish fails:
   - do not republish same npm version.
   - fix extension issue and rerun extension-only job.
2. If extension publishes and npm fails:
   - extension release must be paused until npm version is published.
3. Never reuse a published npm version number.

## Suggested release checklist (per release)

1. `pnpm verify` passes locally.
2. bump `rxjs-monitor` version:
   - without tags: `pnpm bump:patch|minor|major`
   - with tags (recommended for CD): `pnpm release:patch|minor|major`
3. confirm extension manifest version matches package version.
4. merge to `main` or `release/*`.
5. release workflow passes:
   - verify
   - npm publish
   - extension publish
6. smoke test:
   - install package in a sample React app
   - confirm extension update is visible in Chrome Web Store dashboard

## Optional improvements

1. Add changelog generation in release workflow.
2. Add GitHub release notes with links to npm and extension versions.
