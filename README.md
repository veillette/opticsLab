# OpticsLab

A web-based simulation for geometric optical scenes, built with TypeScript and [SceneryStack](https://scenerystack.org).

---

## Features

- Multiple light source types: rays, parallel and divergent beams, and point sources.
- Reflection at linear and curved mirrors.
- Beam splitters.
- Refraction at linear and curved interfaces.
- Ideal lenses and mirrors.
- Spherical lenses.

---

## Tech Stack

| Technology | Role |
|---|---|
| **TypeScript** | Primary language |
| **SceneryStack** | 2D scene graph, accessibility, and UI components |
| **Vite** | Development server and build tool |
| **Biome** | Linter and formatter |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node.js)

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm start
```

The app will be available at `http://localhost:5173`.

### Production build

```bash
npm run build
```

Output is written to `dist/`.

The project targets **ES2024** (`tsconfig.json` and Vite `build.target`). That needs the **Vite 8+** toolchain from `package-lock.json`. If `vite build` reports an unknown `ES2024` target, refresh installs with `npm ci` (or reinstall) so `node_modules` matches the lockfile.


---

## Deployment

The repository includes GitHub Actions workflows:

- **`ci.yml`** — Runs on every push and pull request: Biome (format, lint, assist), TypeScript check, and production build
- **`deploy.yml`** — Builds and deploys to GitHub Pages on push to `main`

For GitHub Pages deployment, set **Settings → Pages → Source** to **GitHub Actions**.

For other hosting targets, upload the contents of `dist/` to any static file server.
