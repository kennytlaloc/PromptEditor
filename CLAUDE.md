# PromptEditor — Claude Instructions

## Branch workflow
- All feature work is done on the `develop` branch (or short-lived `feature/*` branches off it).
- Changes are merged to `main` via Pull Request only.
- Default working branch: **develop**

## Version management
- The app version is defined in `package.json` and injected into the UI at build time via `__APP_VERSION__` (see `vite.config.ts`).
- **When creating a PR**, always ask the user: _"Should the version be incremented for this PR?"_
  - If **yes**, bump `package.json` before opening the PR:
    - `patch` (1.0.x) — bug fixes, minor tweaks
    - `minor` (1.x.0) — new features, non-breaking additions
    - `major` (x.0.0) — breaking changes
  - If **no**, open the PR without changing the version.
- Never hardcode the version string anywhere in the UI — always use `__APP_VERSION__`.
