# OpticsLab

A web application for creating and simulating 2D geometric optical scenes, built with TypeScript and [SceneryStack](https://scenerystack.org). This project is a TypeScript reimplementation inspired by [Ray Optics Simulation](https://github.com/ricktu288/ray-optics) by ricktu288.

---

## Features

- Multiple light source types: rays, parallel/divergent beams, and point sources
- Reflection in linear and curved mirrors, with custom equation support
- Beam splitters and dichroic mirror behavior
- Refraction at linear and curved interfaces
- Ideal lens and mirror optics
- Spherical lens simulation
- Gradient-index (GRIN) materials with custom refractive index functions
- Color mixing, filtering, and chromatic dispersion
- Diffraction grating simulation
- Ray extension visualization for virtual image detection
- Real and virtual image observation
- Measurements: distance, angle, energy flow, momentum flow
- Irradiance mapping with CSV export
- SVG diagram export
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
| **Vitest** | Automated testing |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install and run

```bash
git clone https://github.com/<your-org>/opticsLab.git
cd opticsLab
npm install
npm run dev
```

The development server starts at `http://localhost:5173`.

### Production build

```bash
npm run build
```

Output is placed in the `dist/` directory.

---

## Project Structure

```
opticsLab/
├── src/
│   ├── model/          # Scene and optical element data models
│   ├── view/           # SceneryStack scene graph nodes and views
│   ├── sim/            # Simulation engine (ray tracing, intersection logic)
│   ├── util/           # Geometry helpers and math utilities
│   └── main.ts         # Application entry point
├── test/               # Vitest test suites
├── data/               # Gallery scenes and module definitions
├── public/             # Static assets
└── dist/               # Production build output (generated)
```

---

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build locally
npm run test         # Run test suite
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint
```

---

## Key Differences from Ray Optics Simulation

| Aspect | Ray Optics Simulation | OpticsLab |
|---|---|---|
| Language | JavaScript | TypeScript |
| Rendering | Custom canvas / Vue | SceneryStack (Scenery + Alpenglow) |
| Reactivity | Custom | Axon (observable properties) |
| Accessibility | Partial | First-class via SceneryStack |
| UI Framework | Vue | SceneryStack UI components |

---

## Contributing

Contributions are welcome. Please open an issue before submitting a pull request for significant changes.

Non-code contributions are also valuable:
- New gallery scenes
- Bug reports and feature requests
- Documentation improvements

---

## Acknowledgments

This project is inspired by and modeled after [Ray Optics Simulation](https://github.com/ricktu288/ray-optics) by [ricktu288](https://github.com/ricktu288) and its contributors, licensed under Apache-2.0.

SceneryStack is developed by [PhET Interactive Simulations](https://phet.colorado.edu) at the University of Colorado Boulder.

---

## License

Apache License 2.0 — see [LICENSE](./LICENSE) for details.
