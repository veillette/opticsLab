# Model for OpticsLab

*Summary of the physics and numerics used in the simulation.*

OpticsLab is a **geometric optics** simulation: light is represented as **rays** (straight-line segments between interactions). There is **no propagating wave** in the model—no \( \cos(kx - \omega t + \phi) \) phase evolution through space—so interference and diffraction **except at gratings** are not modeled as waves. That keeps the math accessible while still supporting reflection, refraction, lenses, prisms, simple diffraction orders, and qualitative colour.

---

## Refraction and Snell’s law

At interfaces between air (treated as **\(n = 1\)**, non-dispersive) and glass-like materials, outgoing ray directions use **Snell’s law** in vector form. **Total internal reflection** is applied when no real transmitted direction exists; in that case the ray reflects specularly instead of refracting.

- [Snell’s law](https://en.wikipedia.org/wiki/Snell%27s_law)

---

## Fresnel reflection (optional partial reflect)

When **partial reflection** is enabled on a refracting element, reflected and transmitted **power** at an interface are split using the standard **Fresnel equations** for **s- and p-polarized** light. The simulation carries separate **s** and **p** brightness components; **unpolarized** light is represented by splitting energy equally between them. Very weak reflected rays (below a small brightness threshold) are dropped so the ray tree stays tractable.

- [Fresnel equations](https://en.wikipedia.org/wiki/Fresnel_equations)

When partial reflection is off, refraction still follows Snell’s law but without splitting off a reflected ray at that surface (a simplifying teaching mode).

---

## Dispersion (wavelength-dependent index)

For rays that carry a **wavelength** (in nanometres), the refractive index of glass uses a **Cauchy-type** one-term dispersion: base index plus a term proportional to \(1/\lambda^2\) (with \(\lambda\) in the model’s length units). 

- [Cauchy’s equation (dispersion)](https://en.wikipedia.org/wiki/Cauchy%27s_equation)

Setting the Cauchy **B** coefficient to **0** turns off dispersion for that element (index is then independent of wavelength).

---

## Mirrors and beam splitters

**Specular mirrors** reflect rays so that the angle of incidence equals the angle of reflection with respect to the local surface normal. Curved mirrors (arc, parabolic, ideal curved) sample or constrain geometry so intersections and normals are consistent with the chosen representation.

**Beam splitters** divide energy between a **reflected** ray (law of reflection) and a **transmitted** ray (same direction as incidence) according to a fixed **transmission ratio** \(0\ldots1\). This is a schematic model, not a thin-film stack.

---

## Ideal thin lens

The **ideal lens** does **not** trace rays through glass with Snell’s law. Instead it applies a **thin-lens** mapping: rays are bent at the lens line so that behaviour is consistent with a specified **focal length** (sign convention follows the sim’s lens setup). Rays striking the lens exactly along the optical axis in a degenerate way may pass through with no deflection.

- [Thin lens](https://en.wikipedia.org/wiki/Thin_lens)

---

## Diffraction gratings

**Transmission** and **reflection** gratings use the usual **grating equation** relating groove spacing, wavelength, and diffraction order. Several orders (positive and negative) can be produced; each order’s **relative** strength uses a **sinc²**-type factor tied to the grating **duty cycle** (slit width vs period). Intensities are **renormalized** across the emitted orders so the total does not exceed the incident ray brightness. Orders that would require \(|\sin\theta| > 1\) are skipped.

- [Diffraction grating](https://en.wikipedia.org/wiki/Diffraction_grating)

---

## Ray tracing limits and energy bookkeeping

Tracing stops when:

- A ray undergoes **too many interactions** (default **maximum depth** on the order of **200** segments in the recursion tree—configurable in code), or  
- Its combined **s + p brightness** falls below a **minimum threshold**, or  
- It hits an **absorbing** object (e.g. **line blocker**, **detector**, or aperture treated as opaque in the model).

There is **no exponential absorption** along paths in air or inside uniform glass; **detectors** and **blockers** remove rays from the scene and record or discard that power. At refracting surfaces with Fresnel splitting, reflected and transmitted components **share** the incident energy according to the Fresnel reflectances; the model does not add extra unexplained loss at those surfaces beyond what those equations imply (and threshold-based ray dropping for performance).

---

## Sources, colour, and display

Light sources emit discrete rays (or dense bundles) with assigned **wavelength** and **brightness**. For drawing, wavelength is mapped to an **RGB colour** for the ray display; brightness affects **opacity** (and stacking of many rays can look brighter or “whiter”). **Extended** (dashed) rays can be shown for teaching **virtual images** and ray-construction modes—these are **construction** rays, not additional physical power in the model.
