/**
 * OpticsConstants.ts
 *
 * Central repository for numeric constants shared across the ray-tracing
 * model layer. Constants used in only a single file live at the top of
 * that file instead.
 */

// ── Intersection tolerance ────────────────────────────────────────────────────

/**
 * Minimum squared ray length to accept an intersection.
 * Prevents self-intersection artifacts at the originating surface.
 */
export const MIN_RAY_LENGTH_SQ = 1e-6;

// ── Fresnel / reflection ──────────────────────────────────────────────────────

/**
 * Minimum combined brightness (S + P) for a Fresnel-reflected ray to be spawned.
 * Rays below this threshold are too dim to contribute visibly.
 */
export const FRESNEL_REFLECTION_THRESHOLD = 0.01;

// ── Polarisation ─────────────────────────────────────────────────────────────

/**
 * Default fraction of brightness assigned to each polarisation component (S and P).
 * Unpolarised light is split evenly: brightnessS = brightnessP = brightness * 0.5.
 */
export const POLARIZATION_SPLIT = 0.5;

// ── Ray emission ─────────────────────────────────────────────────────────────

/**
 * Multiplier applied to rayDensity when computing the number of angular steps
 * for a full 2π sweep. Higher values give finer angular resolution per unit density.
 */
export const RAY_DENSITY_SCALE = 500;
