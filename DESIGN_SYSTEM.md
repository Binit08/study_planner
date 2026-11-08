# Design System & Style Guidelines

## Color Palette

| Token | Value / Hex | Usage |
|---|---|---|
| **Canvas Background** | `#000000` to `#0B0B0C` | Deep pure black to near-black base |
| **Card / Surface Fill** | `#141416` or `rgba(255, 255, 255, 0.05)` | Dark translucent frosted glass cards |
| **Card / Surface Border** | `#262629` or `rgba(255, 255, 255, 0.1)` | Subtle translucent border strokes |
| **Primary Text** | `#FFFFFF` | Headings & key metrics |
| **Secondary Text** | `#A1A1AA` to `#B4B4B8` | Body copy, descriptions & paragraphs |
| **Tertiary / Caption Text** | `#71717A` | Sub-labels, metadata & timestamps |
| **Accent & Orb Glows** | Gradient of `#FDE047` (Pale Yellow), `#F59E0B` (Warm Amber), `#38BDF8` to `#60A5FA` (Sky Blue) | Soft radial glows, focal lighting behind elements |
| **Connection Lines / Accents** | `#3F3F46` | Minimalist outlines, thin connected bezier lines |

---

## Typography & Weights

- **Font Family:** Modern geometric / grotesque sans-serif (`Inter`, `SF Pro`, `Geist Sans`, or system sans).
- **Headings:**
  - Letter spacing: `tracking-tight` (`-0.02em` to `-0.03em`)
  - Weight: `font-medium` (500) to `font-bold` (700)
- **Body & Paragraphs:**
  - Weight: Regular (400)
  - Line height: Relaxed (`leading-relaxed` / `1.6` - `1.7`)

---

## Layout & Composition

- **Hero Sections:** Centered single-column flow with generous vertical whitespace (`padding: 80px+` / `py-20` to `py-32`).
- **Card Grids:** Structured, responsive grids with consistent gaps (`gap-4` to `gap-8`).
- **Background Atmosphere:**
  - Subtle dot / grain matrix grid overlaid on pure black background.
  - Soft, blurred radial glow meshes (`blur-3xl`, opacity 20–40%) positioned behind key focal points.
- **Surface Accents:** Frosted / glassmorphism (`backdrop-blur-md` / `backdrop-blur-lg`) with faint 1px borders.

