# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

OpticsLab is a single-page client-side geometric optics simulation built with TypeScript, SceneryStack, and Vite. No backend, database, or Docker services are required.

### Running the application

See `README.md` for standard commands. Key scripts are in `package.json`:

- **Dev server:** `npm start` (serves at `http://localhost:5173`)
- **Lint:** `npm run lint` (Biome)
- **Format:** `npm run format` (Biome, auto-fix)
- **Type check:** `npm run check` (runs `tsc --noEmit` for both main and scripts tsconfigs)
- **Tests:** `npm test` (Vitest, single run) / `npm run test:watch`
- **Build:** `npm run build` (TypeScript compile + Vite production build)

### Caveats

- Git hooks (`.githooks/`) are configured by `npm run prepare` (runs automatically on `npm install`). The pre-commit hook auto-formats with Biome; the pre-push hook runs lint + type check. Use `npm run commit:skip` or `npm run push:skip` to bypass when needed.
- `CLAUDE.MD` contains code style guidelines and lists `npm run lint` and `npm run format` as the commands to run before submitting changes.
- Tests take ~30s due to memory-leak tests using happy-dom environment.
- The production build emits a large single chunk (~2.9 MB); this is expected and not a build error.
