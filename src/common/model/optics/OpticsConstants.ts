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

/**
 * Multiplier applied to (segmentLength × rayDensity) when computing the number
 * of rays for a beam source.  The segment length is in model metres while
 * rayDensity was calibrated for pixel coordinates, so this factor (equal to
 * pixels-per-metre) restores the intended ray count.
 */
export const BEAM_RAY_DENSITY_SCALE = 100;

/**
 * Brightness value at which a source transitions from discrete-ray mode
 * (few individual rays) to continuous-beam mode (max rays, intensity-controlled).
 * Below this threshold, brightness scales the number of emitted rays.
 * At and above this threshold, the maximum number of rays is emitted and brightness
 * controls the per-ray rendering intensity.
 */
export const BRIGHTNESS_CONTINUOUS_THRESHOLD = 1.0;

/**
 * Normalization divisor that maps the brightness property to a [0, 1] per-ray
 * intensity value in continuous-beam mode. Equals the maximum allowed brightness.
 */
export const BRIGHTNESS_NORMALIZE = 2.0;

/**
 * Reference ray density used to calibrate per-ray brightness.
 * At this density each ray has its "full" brightness.
 * Above this density, per-ray brightness scales inversely with density so that
 * total luminosity is conserved: 2× rays → each at ½ brightness.
 * Should equal DEFAULT_RAY_DENSITY in OpticsLabConstants.
 */
export const RAY_DENSITY_REFERENCE = 0.5;
