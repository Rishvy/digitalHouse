# Design System Document | K.T Digital House

## 1. Overview & Creative North Star
**Creative North Star: "The Kinetic Editorial"**

This design system is engineered to move K.T Digital House away from the static, "grid-locked" feel of traditional e-commerce and into the realm of high-energy, digital-first storytelling. By combining the visceral impact of vibrant yellow with the precision of brutalist-inspired typography, we create a space that feels both professional and high-velocity.

The visual signature is defined by **intentional asymmetry** and **tonal layering**. Instead of boxing products into rigid squares, we use white space as a structural element, allowing high-quality imagery to break the container bounds. This is not just a shop; it is a curated digital experience that mirrors the high-energy environment of a modern digital solution house.

---

## 2. Colors
Our palette is a high-contrast dialogue between energy (`primary_container`) and authority (`on_surface`).

*   **The Primary Engine:** The brand's signature yellow is represented by the `primary_container` (#ffd709). This is our "High-Energy" signal. Use it for hero backgrounds, key interaction states, and brand-defining moments.
*   **The Neutral Core:** We use a sophisticated grayscale—from the deep `on_surface` (#2d2f2f) to the crisp `surface_container_lowest` (#ffffff)—to provide a professional, editorial foundation.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Structural boundaries must be defined solely through background color shifts.
*   *Example:* A product grid section using `surface_container_low` (#f0f1f1) should sit directly against a `surface` (#f6f6f6) background. The change in tone is the divider.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials. 
*   **Level 0 (Base):** `surface` (#f6f6f6).
*   **Level 1 (Sectioning):** `surface_container` (#e7e8e8).
*   **Level 2 (Active Cards):** `surface_container_highest` (#dbdddd).
By nesting these, we create depth without visual clutter.

### Signature Textures & Glassmorphism
To achieve a "digital" polish, use semi-transparent layers for floating navigation or overlays. Use `surface_container_lowest` at 70% opacity with a `24px` backdrop blur. This "Glass" effect allows the vibrant yellow to bleed through, maintaining energy even in dense information areas.

---

## 3. Typography
We utilize a dual-typeface strategy to balance "Digital Professionalism" with "High-End Editorial."

*   **Display & Headlines (Space Grotesk):** This is our "voice." It is technical, modern, and high-contrast. Use `display-lg` for hero statements with tight letter-spacing (-0.02em) to create an authoritative, "bold black" impact.
*   **Body & Labels (Manrope):** Our "utility" font. Manrope offers exceptional legibility at small scales. Use `body-md` for product descriptions and `label-md` for technical specs.
*   **Hierarchy Note:** Always pair a large `display-sm` headline with a significantly smaller `label-md` uppercase subtitle to create the "Editorial" scale contrast found in premium magazines.

---

## 4. Elevation & Depth
Depth in this system is a result of light and layering, not artificial outlines.

*   **The Layering Principle:** Place `surface_container_lowest` cards on `surface_container_low` backgrounds. This creates a "Natural Lift" that feels integrated into the environment.
*   **Ambient Shadows:** When an element must float (e.g., a "Quick Buy" modal), use a shadow tinted with the brand's `on_surface` color: `rgba(45, 47, 47, 0.08)` with a `40px` blur and `10px` Y-offset. Avoid pure black shadows; they feel "cheap" and dated.
*   **The "Ghost Border" Fallback:** If accessibility requires a container edge, use a "Ghost Border": the `outline_variant` (#acadad) at 15% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons (High-Energy Interaction)
*   **Primary:** Solid `primary_container` (#ffd709) with `on_primary_fixed` (#453900) text. Roundedness: `DEFAULT` (0.25rem) for a sharp, professional edge.
*   **Secondary:** Solid `on_surface` (#2d2f2f) with `surface` (#f6f6f6) text. This provides the "Bold Black" contrast requested.
*   **Tertiary:** No background. `primary` (#6c5a00) text with an underline that appears only on hover.

### Cards & Product Imagery
*   **Layout:** Forbid the use of dividers. Use `surface_container_high` (#e1e3e3) for card backgrounds. 
*   **Imagery:** Images should be high-key (bright) and professional. Suggest an "Overhang" pattern where the product image slightly breaks the top edge of the card container to create 3D depth.

### Input Fields
*   **Style:** Minimalist. Use `surface_container_low` as the background. On focus, the bottom border animates to 2px width using the `primary` (#6c5a00) color.
*   **Error State:** Use `error` (#b02500) text only. Do not turn the entire box red; keep the professional aesthetic intact.

### Showcase Chips
*   **Digital Utility:** Use for categories (e.g., "Mirrorless," "Drones"). Use `secondary_container` (#e2e2e2) with `on_secondary_fixed` (#3f3f3f) text. Shape: `full` (pill-shaped) to contrast against the sharper card edges.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts. Let a headline sit 25% off-center to create visual interest.
*   **Do** use the `primary_container` yellow for "Micro-Moments"—a hover state, a price tag, or a notification dot.
*   **Do** leverage the high-contrast "Black on Yellow" for high-priority Call-to-Actions.
*   **Do** prioritize large, high-quality product photography. The imagery should do 60% of the visual work.

### Don't
*   **Don't** use 1px solid black lines to separate content. It breaks the "premium" feel.
*   **Don't** use standard "Material Blue" or "Success Green" unless absolutely necessary for system errors. Stick to our brand tonal palette.
*   **Don't** clutter the screen. If a section feels crowded, increase the vertical white space using the `xl` (0.75rem) or higher spacing increments.
*   **Don't** use heavy drop shadows on every card. Reserve elevation for elements that are truly interactive or temporary.