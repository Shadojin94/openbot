// The OpenBot mark as plain data, so that a canvas can draw the same mark that
// `AppLogo` draws as SVG: the social cards in apps/auth-api do.

/** The mark is a square of this side, in its own units. */
export const APP_LOGO_SIZE = 240;
/** The corner radius of the square, in the same units. */
export const APP_LOGO_CORNER = 50;

/** Each eye is one scribbled stroke, as SVG `points`. */
export const APP_LOGO_EYE_POINTS = {
  left: "43.55 93.61 64.69 81.41 36.48 108.04 79.67 83.11 35.93 122.88 91.58 90.74 38.9 132.69 97.66 98.76 42.44 138.88 100.43 105.4 46.9 143.83 101.97 112.04 55.08 149.51 101.83 122.52 73.01 152.43 94.14 140.23",
  right:
    "145.65 93.61 166.79 81.41 140.83 101.52 175.58 81.46 138.3 109.53 183.18 83.63 137.55 117.43 189.67 87.33 139.67 129.39 197.88 95.78 142.92 136.32 201.52 102.48 149.03 143.86 204.07 112.08 159.14 150.37 203.51 124.75 169.28 152.61 199.82 134.98",
} as const;

/**
 * The Zetabot mark (Lee's v4): a black tile, a thin halo of the Zetamind spectral thread and two
 * round eyes. The source is drawn on a 512 grid; these are the same values on the 240 grid above.
 */
const ZETABOT_SCALE = APP_LOGO_SIZE / 512;

export const APP_LOGO_HALO = { cx: 120, cy: 120, r: 196.8 * ZETABOT_SCALE } as const;

/** The halo as radial gradient stops: transparent inside, the eight colours, transparent outside. */
export const APP_LOGO_HALO_STOPS = [
  { offset: 0.86, color: "#c026d3", opacity: 0 },
  { offset: 0.8775, color: "#c026d3", opacity: 1 },
  { offset: 0.8925, color: "#8b5cf6", opacity: 1 },
  { offset: 0.9075, color: "#3d7bff", opacity: 1 },
  { offset: 0.9225, color: "#22e4ff", opacity: 1 },
  { offset: 0.9375, color: "#5cffb0", opacity: 1 },
  { offset: 0.9525, color: "#ffd84d", opacity: 1 },
  { offset: 0.9675, color: "#ff8a3d", opacity: 1 },
  { offset: 0.9825, color: "#ff4fa3", opacity: 1 },
  { offset: 1, color: "#ff4fa3", opacity: 0 },
] as const;

export const APP_LOGO_EYES = {
  cy: 120,
  r: 18 * ZETABOT_SCALE,
  left: { cx: 222 * ZETABOT_SCALE },
  right: { cx: 290 * ZETABOT_SCALE },
} as const;
