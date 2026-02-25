# OpticsLab

A web application for creating and simulating 2D geometric optical scenes, built with TypeScript and [SceneryStack](https://scenerystack.org).

---

## Features

- Multiple light source types: rays, parallel/divergent beams, and point sources
- Reflection in linear and curved mirrors, with custom equation support
- Beam splitters and dichroic mirror behavior
- Refraction at linear and curved interfaces
- Ideal lens and mirror optics
- Spherical lens simulation
- Color mixing, filtering, and chromatic dispersion
- Ray extension visualization for virtual image detection
- Real and virtual image observation
- Measurements: distance, angle
- Modular optical element combinations

---

## Tech Stack

| Technology | Role |
|---|---|
| **TypeScript** | Primary language |
| **SceneryStack** | 2D scene graph, rendering (Canvas / SVG / WebGL / WebGPU), accessibility, and UI components |
| **Axon** | Reactive property and event system |
| **Kite** | Vector graphics and path geometry |
| **Joist** | Application framework |
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

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run check` | Run TypeScript type checking |
| `npm run lint` | Lint with Biome |
| `npm run format` | Format with Biome |
| `npm run fix` | Fix lint and format issues |
| `npm run serve` | Serve the production build locally |
| `npm run clean` | Remove the `dist/` directory |
| `npm run icons` | Regenerate app icons from `public/icons/icon.svg` |

---

## Project Structure

```
opticsLab/
├── src/
│   ├── main.ts              # App entry point
│   ├── init.ts              # Simulation metadata (name, version, locales)
│   ├── splash.ts            # Splash screen
│   ├── brand.ts             # Branding metadata
│   ├── assert.ts            # Assertion utilities
│   ├── OpticsLabColors.ts   # Centralized color properties (default + projector)
│   ├── OpticsLabConstants.ts # Layout and validation constants
│   ├── OpticsLabNamespace.ts # SceneryStack namespace registration
│   ├── i18n/
│   │   ├── StringManager.ts # Localization singleton
│   │   ├── strings_en.json # English strings
│   │   └── strings_fr.json # French strings
│   ├── preferences/
│   │   ├── OpticsLabPreferencesModel.ts # User preferences
│   │   ├── OpticsLabPreferencesNode.ts # Preferences UI
│   │   └── opticsLabQueryParameters.ts  # Query parameter definitions
│   └── screen-name/
│       ├── SimScreen.ts     # Screen wiring (model + view)
│       ├── model/
│       │   └── SimModel.ts  # Application state
│       └── view/
│           └── SimScreenView.ts # Root view and layout
├── scripts/                 # Build scripts (icon generation)
├── public/                  # Static assets
└── dist/                    # Production build output (generated)
```

---

## Deployment

The repository includes GitHub Actions workflows:

- **`ci.yml`** — Runs on every push and pull request: type-check, lint, and build
- **`deploy.yml`** — Builds and deploys to GitHub Pages on push to `main`

For GitHub Pages deployment, set **Settings → Pages → Source** to **GitHub Actions**.

For other hosting targets, upload the contents of `dist/` to any static file server.
