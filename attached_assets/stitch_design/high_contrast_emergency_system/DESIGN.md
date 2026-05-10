---
name: High-Contrast Emergency System
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#e1bebc'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#a98987'
  outline-variant: '#59413f'
  surface-tint: '#ffb3ae'
  primary: '#ffb3ae'
  on-primary: '#68000c'
  primary-container: '#f85b58'
  on-primary-container: '#5c0009'
  inverse-primary: '#b3282c'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#c8c6c5'
  on-tertiary: '#303030'
  tertiary-container: '#929090'
  on-tertiary-container: '#2a2a2a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#ffb3ae'
  on-primary-fixed: '#410004'
  on-primary-fixed-variant: '#900a18'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  display-lg:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1280px
---

## Brand & Style

This design system is engineered for high-stress, mission-critical environments where split-second legibility and clear hierarchy are paramount. The aesthetic merges **Modern Minimalism** with **High-Contrast Boldness** to create a UI that feels urgent, authoritative, and indestructible.

By utilizing a strict palette of deep blacks and aggressive reds, the system eliminates visual noise and directs the user's focus exclusively to actionable data and primary workflows. The mood is clinical, serious, and responsive, ensuring that "Success" is not a passive state but a bold, confirmed action.

## Colors

The palette is intentionally restrictive to maintain the emergency response narrative. 

- **Alert Red (#E24B4A):** This is the singular accent color. It serves as the primary action color, the success state, and the critical alert state. It replaces all traditional green/success indicators to signify that every completed task in an emergency is a high-priority event.
- **Pure Black (#000000):** Used for the base background to maximize contrast and reduce eye strain in low-light environments.
- **Grayscale Tier:** White (#FFFFFF) is reserved for primary information and headers. Mid-range grays are used for secondary metadata and inactive states to ensure the Red and White elements remain the focal points.

## Typography

The system exclusively uses **Atkinson Hyperlegible Next** to guarantee maximum readability for users with low vision or those operating in high-vibration/distracted environments. 

- **Headlines:** Set with tight tracking and heavy weights to command attention.
- **Labels:** Use uppercase styling for system-level notifications and button text to differentiate them from content-heavy body text.
- **Success/Action Text:** Frequently paired with the Alert Red color to denote primary pathways.

## Layout & Spacing

This design system utilizes a **Fixed Grid** model on desktop and a **Fluid Grid** on mobile devices. 

- **The 4px Base:** All spacing, padding, and margins are multiples of 4px to ensure a rigorous, mathematical rhythm.
- **Desktop:** 12-column grid with 24px gutters. Elements should snap to the grid to maintain a structured, "command center" feel.
- **Mobile:** 4-column grid with 16px margins. Touch targets are oversized (minimum 48px) to accommodate rapid, imprecise interactions during emergencies.

## Elevation & Depth

Depth is conveyed through **Tonal Layering** rather than traditional shadows. In a pure black environment, elevation is signaled by increasing the lightness of the background gray.

- **Level 0 (Base):** #000000 (Deepest background).
- **Level 1 (Cards/Containers):** #1A1A1A (Slightly lifted).
- **Level 2 (Modals/Pop-overs):** #2C2C2C (Highest surface).
- **Borders:** Instead of soft shadows, use 1px solid borders in #333333 to define boundaries between dark elements. High-priority active states use a 2px Alert Red border.

## Shapes

While the theme is high-contrast and urgent, it retains **Rounded Corners** to prevent the UI from feeling hostile and to improve the visual grouping of elements. 

- **Standard Elements:** 0.5rem (8px) radius for buttons and input fields.
- **Large Containers:** 1rem (16px) radius for cards and modals.
- **Interaction Cues:** Focus states and selections follow the container's radius exactly, creating a "nested" look.

## Components

- **Buttons:** 
    - **Primary:** Background #E24B4A, Text #FFFFFF (Bold/Uppercase).
    - **Secondary:** Transparent background, 2px #E24B4A border, Red text.
    - **Danger/Success:** Both use #E24B4A, as the system treats "Success" as an urgent resolution.
- **Inputs:** Dark surfaces (#1A1A1A) with a 1px Gray border. On focus, the border shifts to 2px Alert Red.
- **Chips/Status:** Use #E24B4A background for all active or "resolved" states. Use #333333 for "pending" or "standby" states.
- **Progress Bars:** Background #1A1A1A, fill color #E24B4A. No gradients or animations unless indicating an active data stream.
- **Cards:** Background #1A1A1A with no shadow. Use high-contrast White text for titles to ensure they pop against the dark surface.