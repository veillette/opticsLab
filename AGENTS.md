# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

OpticsLab is a pure client-side geometric optics simulation (TypeScript + SceneryStack + Vite). No backend, database, or external services are needed.

### Key commands

See `package.json` scripts and `README.md` for the canonical list. Highlights:

| Task | Command |
|---|---|
| Install deps | `npm install` |
| Dev server | `npm start` (serves at `localhost:5173`) |
| Lint + format check | `npm run lint` |
| Auto-fix lint/format | `npm run fix` |
| Type check | `npm run check` |
| Unit tests | `npm test` |
| Build | `npm run build` |

### Non-obvious caveats

- **Git hooks**: The repo uses `.githooks/` (not `.husky/`). `npm install` runs a `prepare` script that sets `core.hooksPath` to `.githooks`. The pre-commit hook auto-fixes formatting with Biome; the pre-push hook runs lint + type-check. Use `npm run commit:skip` / `npm run push:skip` to bypass hooks when needed.
- **ES2024 target**: Both `tsconfig.json` and Vite `build.target` use ES2024, which requires Vite 8+ from the lockfile. If the build fails on an unknown target, run `npm ci` to ensure `node_modules` matches the lockfile.
- **Tests use happy-dom**: Vitest runs with `happy-dom` environment and a Canvas 2D mock (`tests/setup.ts`). No real browser is needed for unit tests.
- **`CLAUDE.MD`**: Contains code-style conventions and post-change checklist (`npm run lint`, `npm run format`). Follow those conventions when making code changes.
- **`optics-template/` directory**: Per `CLAUDE.MD`, this directory can be ignored initially.
