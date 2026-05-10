# PAN!C — Personal Alert Network · Interactive Crisis Communication

> Emergency alert app for immigrant communities — press a button, alert your people, know your rights.

---

## What It Does

PAN!C is a full-stack web application that lets users:

- **Trigger a panic alert** with one button press — sends SMS to all emergency contacts via Twilio
- **Manage emergency contacts** — add, edit, delete with priority ordering
- **Store encrypted documents** — passports, IDs, legal papers with AES-256-GCM encryption
- **Set check-in timers** — automatic alerts if you miss a check-in
- **Chat with an AI legal assistant** — Gemini-powered know-your-rights guidance
- **Log incidents on-chain** — tamper-proof Solana memo for every incident

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express |
| Database | MongoDB Atlas (8 collections) |
| Auth | JWT (access + refresh tokens) + bcrypt |
| SMS Alerts | Twilio |
| AI Voice | ElevenLabs |
| AI Chat | Google Gemini |
| Long-term Memory | Backboard.io |
| On-chain Logging | Solana |
| Encryption | AES-256-GCM (documents) |

---

## Project Structure

```
PAN-C/
├── src/                    # React frontend (Vite + TypeScript)
│   ├── screens/            # 7 screens: Login, SignUp, Home, Contacts,
│   │                       #   Documents, CheckIn, Chat, PanicActive
│   ├── components/         # 8 reusable UI components
│   ├── context/            # AuthContext — JWT token management
│   ├── services/           # API client + 5 third-party service wrappers
│   └── theme/              # Design tokens (colors, spacing, typography)
├── server/                 # Express backend
│   └── src/
│       ├── routes/         # auth, contacts, documents, checkin, panic, chat
│       ├── middleware/     # JWT auth middleware
│       └── db.js           # MongoDB Atlas connection + index creation
├── rn/                     # Expo React Native app (for Expo Go on mobile)
├── mongodb/schemas/        # Atlas JSON Schema validation files
├── .replit                 # Replit hosting config
└── replit.nix              # Nix environment (Node 20)
```

---

## Running Locally

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (free tier works)
- Twilio account (for SMS)
- Google AI Studio account (for Gemini)

### Setup

```bash
git clone https://github.com/raghavked/PAN-C.git
cd PAN-C

# Install all dependencies (frontend + backend)
npm run install:all

# Create environment files (see Secrets Reference below)
# Add your keys to server/.env and optionally src/.env

# Start both servers together
npm run dev
```

The app will be at `http://localhost:5173`. The API runs at `http://localhost:3001`.

In dev mode, Vite automatically proxies `/api/*` requests to the Express backend — no CORS issues, no extra config needed.

---

## Deploying on Replit

### Step 1 — Import the repo
1. Go to [replit.com/new](https://replit.com/new) → **Import from GitHub**
2. Paste: `https://github.com/raghavked/PAN-C`
3. Replit detects `.replit` automatically

### Step 2 — Add Secrets
In your Repl → **🔒 Secrets** tab, add the following:

#### Backend secrets (used by `server/`)
| Key | Value |
|---|---|
| `MONGODB_URI` | `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority` |
| `MONGODB_DATABASE` | `pan_c` |
| `JWT_SECRET` | Run `openssl rand -hex 64` to generate |
| `JWT_REFRESH_SECRET` | Run `openssl rand -hex 64` to generate |
| `ENCRYPTION_KEY` | Run `openssl rand -hex 32` to generate |
| `TWILIO_ACCOUNT_SID` | From [console.twilio.com](https://console.twilio.com) |
| `TWILIO_AUTH_TOKEN` | From [console.twilio.com](https://console.twilio.com) |
| `TWILIO_PHONE_NUMBER` | Your Twilio number in E.164 format e.g. `+15551234567` |
| `ELEVENLABS_API_KEY` | From [elevenlabs.io](https://elevenlabs.io) → Profile → API Keys |
| `ELEVENLABS_VOICE_ID` | Default: `21m00Tcm4TlvDq8ikWAM` (Rachel) |
| `GEMINI_API_KEY` | From [aistudio.google.com](https://aistudio.google.com) |

#### Frontend secrets (must use `VITE_` prefix)
| Key | Value |
|---|---|
| `VITE_API_URL` | `https://<your-repl-name>.<your-username>.repl.co/api` |

> **How to get your Replit URL:** After clicking Run for the first time, Replit shows your app URL at the top of the browser preview. Use that URL + `/api` as your `VITE_API_URL`.

### Step 3 — Run
Click **Run** — Replit starts both the frontend (port 3000) and backend (port 3001) together.

### Step 4 — Deploy (permanent public URL)
Click **Deploy** in Replit for a permanent HTTPS URL that stays live 24/7.

---

## MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → your cluster → **Connect** → **Drivers** → **Node.js v5.5+**
2. Copy the `mongodb+srv://` URI → set as `MONGODB_URI` in Replit Secrets
3. Go to **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (required for Replit)
4. The backend automatically creates all indexes on first startup — no manual setup needed

### Collections Created Automatically
| Collection | Purpose |
|---|---|
| `users` | Accounts, hashed passwords, safe phrases |
| `contacts` | Emergency contacts per user |
| `documents` | Encrypted document metadata |
| `checkInSettings` | Timer intervals and preferences |
| `checkInHistory` | Check-in event log |
| `incidents` | Panic incident records |
| `chatbotConversations` | Gemini chat history |
| `appSettings` | Per-user app preferences |

---

## Expo Go (Mobile)

The `rn/` directory contains a full React Native port for Expo Go.

```bash
cd rn
npm install
npx expo start
# Scan QR code with Expo Go app on your phone
```

Add `EXPO_PUBLIC_` prefixed keys (same values as above) to `rn/.env`.

---

## Security

- All `.env` files are gitignored — **no credentials are ever committed to this repo**
- Document contents are encrypted with AES-256-GCM before storage
- JWT access tokens expire in 7 days; refresh tokens in 30 days
- Passwords are hashed with bcrypt (10 rounds)
- Safe phrases are stored as bcrypt hashes — never in plaintext

---

## License

MIT — Built for community safety.
