/**
 * OpticsLabPreferencesModel - Model for OpticsLab simulation preferences.
 *
 * Manages user preferences for the OpticsLab simulation.
 */

import { BooleanProperty, NumberProperty, StringUnionProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { Tandem } from "scenerystack/tandem";
import {
  GRID_SPACING_MAX_M,
  GRID_SPACING_MIN_M,
  MAX_RAY_DEPTH_PROPERTY_MAX,
  MAX_RAY_DEPTH_PROPERTY_MIN,
} from "../OpticsLabConstants.js";
import opticsLab from "../OpticsLabNamespace.js";
import opticsLabQueryParameters from "./opticsLabQueryParameters.js";

export type SignConvention = "newCartesian" | "realIsPositive";

export class OpticsLabPreferencesModel {
  /**
   * Whether the components snapToGrid.
   */
  public readonly snapToGridProperty: BooleanProperty;

  /**
   * Spacing between major grid lines, in model metres.
   */
  public readonly gridSpacingProperty: NumberProperty;

  /**
   * Sign convention used to display radii of curvature for SphericalLens.
   * "newCartesian": biconvex lens R₁ > 0, R₂ < 0
   * "realIsPositive": biconvex lens R₁ > 0, R₂ > 0  (R₂_display = −R₂_model)
   */
  public readonly signConventionProperty: StringUnionProperty<SignConvention>;

  /**
   * Whether Fresnel partial reflection is enabled for glass surfaces.
   * Off by default to keep the display uncluttered.
   */
  public readonly partialReflectionEnabledProperty: BooleanProperty;

  /**
   * When true, sliders that normally show radius of curvature R display
   * curvature κ = 1/R (m⁻¹) instead.
   */
  public readonly useCurvatureDisplayProperty: BooleanProperty;

  /**
   * When true, rays that strike the flat aperture-rim edges of a SphericalLens
   * are absorbed rather than refracted, simulating an opaque lens barrel.
   */
  public readonly lensRimBlockingProperty: BooleanProperty;

  /**
   * Integer cap on ray recursion depth; passed into RayTracer on each simulate().
   * Same range as `OpticsScene.maxRayDepthProperty`.
   */
  public readonly maxRayDepthProperty: NumberProperty;

  public constructor(tandem?: Tandem) {
    this.snapToGridProperty = new BooleanProperty(
      opticsLabQueryParameters.snapToGrid,
      tandem ? { tandem: tandem.createTandem("snapToGridProperty") } : undefined,
    );

    this.gridSpacingProperty = new NumberProperty(opticsLabQueryParameters.gridSpacing, {
      range: new Range(GRID_SPACING_MIN_M, GRID_SPACING_MAX_M),
      ...(tandem && { tandem: tandem.createTandem("gridSpacingProperty") }),
    });

    this.signConventionProperty = new StringUnionProperty<SignConvention>("newCartesian", {
      validValues: ["newCartesian", "realIsPositive"],
      ...(tandem && { tandem: tandem.createTandem("signConventionProperty") }),
    });

    this.partialReflectionEnabledProperty = new BooleanProperty(
      false,
      tandem ? { tandem: tandem.createTandem("partialReflectionEnabledProperty") } : undefined,
    );

    this.useCurvatureDisplayProperty = new BooleanProperty(
      false,
      tandem ? { tandem: tandem.createTandem("useCurvatureDisplayProperty") } : undefined,
    );

    this.lensRimBlockingProperty = new BooleanProperty(
      opticsLabQueryParameters.lensRimBlocking,
      tandem ? { tandem: tandem.createTandem("lensRimBlockingProperty") } : undefined,
    );

    this.maxRayDepthProperty = new NumberProperty(opticsLabQueryParameters.maximumLightRayDepth, {
      range: new Range(MAX_RAY_DEPTH_PROPERTY_MIN, MAX_RAY_DEPTH_PROPERTY_MAX),
      numberType: "Integer",
      phetioFeatured: true,
      phetioDocumentation: "Maximum ray recursion depth before tracing stops.",
      ...(tandem && { tandem: tandem.createTandem("maxRayDepthProperty") }),
    });
  }

  public reset(): void {
    this.snapToGridProperty.reset();
    this.gridSpacingProperty.reset();
    this.signConventionProperty.reset();
    this.partialReflectionEnabledProperty.reset();
    this.useCurvatureDisplayProperty.reset();
    this.lensRimBlockingProperty.reset();
    this.maxRayDepthProperty.reset();
  }
}

opticsLab.register("OpticsLabPreferencesModel", OpticsLabPreferencesModel);
