# PAN-C — ICE Panic Button

> Emergency alert application for immigrant communities. One tap to notify contacts, play audio alerts, and share documents.

[![CI](https://github.com/raghavked/PAN-C/actions/workflows/ci.yml/badge.svg)](https://github.com/raghavked/PAN-C/actions/workflows/ci.yml)

---

## Overview

PAN-C (Panic Alert Network - Community) is a mobile-first web application that gives users a single large panic button to trigger an emergency alert. When pressed, it:

- Notifies all pre-configured emergency contacts via SMS and email
- Plays an audio alert ("HELP — ICE / MIGRA")
- Captures and shares the user's location
- Generates a unique incident ID for tracking
- Starts a check-in countdown timer

---

## Screens

| Screen | Description |
|--------|-------------|
| **Home Dashboard** | Panic button, status cards, quick navigation |
| **Emergency Active** | Flashing alert, audio waveform, timer, safe-phrase disarm |
| **Emergency Contacts** | Manage contacts with notification methods |
| **Document Vault** | Store and share identity documents |

---

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build tool**: Vite 5
- **Styling**: CSS-in-JS (inline styles with design tokens)
- **Typography**: Atkinson Hyperlegible (Google Fonts)
- **Audio**: Web Audio API
- **Location**: Geolocation API

---

## Design System

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#E24B4A` | Panic button, active states |
| `background` | `#131313` | App background |
| `surface` | `#1B1B1B` | Cards, headers |
| `onSurface` | `#E2E2E2` | Body text |

### Typography

All text uses **Atkinson Hyperlegible Next** — designed for maximum legibility, especially for users with low vision.

### Spacing

4px base grid: `xs=4`, `sm=8`, `md=12`, `lg=16`, `xl=24`, `xxl=32`

---

## Component Library

| Component | Location | Description |
|-----------|----------|-------------|
| `PrimaryButton` | `src/components/buttons/` | Filled CTA button |
| `SecondaryButton` | `src/components/buttons/` | Outlined button |
| `TextInput` | `src/components/inputs/` | Accessible text field |
| `Card` | `src/components/cards/` | Surface container |
| `StatusBadge` | `src/components/common/` | Status indicator pill |
| `PanicButton` | `src/components/panic/` | Animated 200px panic trigger |
| `Header` | `src/components/common/` | Sticky top navigation bar |
| `TabBar` | `src/components/common/` | Bottom tab navigation |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Local Development

```bash
# Clone the repository
git clone https://github.com/raghavked/PAN-C.git
cd PAN-C

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Production Build

```bash
npm run build
npm run preview
```

---

## Deploying to Replit

1. Go to [replit.com](https://replit.com) and create a new Repl
2. Choose **"Import from GitHub"**
3. Enter: `https://github.com/raghavked/PAN-C`
4. Replit will auto-detect the `.replit` config
5. Click **Run** — the app starts on port 3000
6. Click **Deploy** for a permanent public URL

The `.replit` file is pre-configured:
- **Dev**: `npm run dev` (hot reload)
- **Deploy**: `npm run build && npm run preview`

---

## API Stubs

The following API endpoints are stubbed and ready for backend integration:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/panic/trigger` | POST | Trigger emergency alert |
| `/api/panic/disarm` | POST | Disarm with safe phrase |
| `/api/panic/check-in` | POST | Reset countdown timer |

See `src/services/panicService.ts` for request/response types.

---

## Environment Variables

```env
VITE_API_URL=http://localhost:3000/api
VITE_ENABLE_AUDIO=true
VITE_ENABLE_LOCATION=true
VITE_ENABLE_NOTIFICATIONS=true
```

---

## Sprint Status

- [x] Phase 1: Repo initialization
- [x] Phase 2: Design tokens + theme
- [x] Phase 3: Component library (8 components)
- [x] Phase 4: Screen layouts (4 screens)
- [x] Phase 5: Panic button integration
- [x] Phase 6: GitHub + Replit config
- [ ] Phase 7: Backend API integration
- [ ] Phase 8: Push notifications
- [ ] Phase 9: Map screen (activity heat map)

---

## License

MIT — Built for community safety.
