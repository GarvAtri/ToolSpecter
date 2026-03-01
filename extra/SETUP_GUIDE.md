# CAT INSPECT AI — Complete Setup Guide
### HackIllinois 2026 · Caterpillar Track

---

## 📁 COMPLETE FOLDER STRUCTURE

```
cat-inspect/
│
├── cat-inspect-app/                    ← React Native (Expo) app
│   ├── App.tsx                         ← Root + Navigation setup
│   ├── app.config.js                   ← Expo config (permissions, plugins)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                            ← EXPO_PUBLIC_API_URL etc.
│   ├── assets/
│   │   ├── icon.png
│   │   ├── splash.png
│   │   └── models/                     ← Your .glb files go here
│   │       ├── cat320.glb
│   │       ├── cat950.glb
│   │       └── catd6.glb
│   └── src/
│       ├── screens/
│       │   ├── SplashScreen.tsx        ← Animated CAT logo fade in/out
│       │   ├── LoginScreen.tsx         ← Google, SSO, email login
│       │   ├── FleetScreen.tsx         ← 3D GLB carousel + infinite loop
│       │   ├── InspectionSetupScreen.tsx  ← Checklist upload + mode select
│       │   ├── LiveCameraScreen.tsx    ← 🔴 CORE: camera + GPT-4o + AR overlay
│       │   ├── ReportScreen.tsx        ← Color-coded report + PDF export
│       │   └── AddVehicleScreen.tsx    ← Register vehicle + upload GLB
│       ├── components/
│       │   └── ChecklistPanel.tsx      ← Slide-out checklist with progress
│       ├── hooks/
│       │   ├── useVehicles.ts          ← Fetch/cache fleet from backend
│       │   └── useVoiceControl.ts      ← "Hey CAT" wake word + Whisper STT
│       ├── services/
│       │   ├── api.ts                  ← Axios client with JWT injection
│       │   └── socket.ts              ← Socket.io real-time client
│       ├── constants/
│       │   └── checklist.ts            ← Default 16-item inspection checklist
│       └── theme.ts                    ← Colors, fonts (CAT brand)
│
└── cat-inspect-backend/                ← Node.js + Express backend
    ├── server.js                       ← Express + Socket.io entry point
    ├── .env                            ← API keys, DB URL
    ├── package.json
    ├── prisma/
    │   └── schema.prisma               ← DB schema (User, Vehicle, Session, Finding, Report)
    ├── routes/
    │   ├── auth.js                     ← Google OAuth, CAT SSO, email login
    │   ├── vehicles.js                 ← CRUD + GLB upload to GCS
    │   ├── inspections.js              ← Sessions, findings, completion
    │   ├── ai.js                       ← Frame analysis, voice, parts ID
    │   └── reports.js                  ← AI report gen, PDF export
    ├── services/
    │   ├── aiService.js                ← GPT-4o Vision, Gemini, Claude, Whisper, TTS
    │   └── db.js                       ← Prisma ORM queries
    └── middleware/
        ├── authenticate.js             ← JWT verification
        └── errorHandler.js             ← Global error handler
```

---

## 🚀 STEP-BY-STEP SETUP

---

### PREREQUISITES

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | https://nodejs.org |
| npm | 10+ | comes with Node |
| Expo CLI | latest | `npm i -g expo-cli eas-cli` |
| PostgreSQL | 15+ | https://postgresql.org |
| Git | any | https://git-scm.com |
| Xcode | 15+ | Mac App Store (iOS only) |
| Android Studio | latest | for Android |

---

### STEP 1 — Clone & Install

```bash
# Clone
git clone <your-repo-url> cat-inspect
cd cat-inspect

# Install frontend deps
cd cat-inspect-app
npm install

# Install backend deps
cd ../cat-inspect-backend
npm install
```

---

### STEP 2 — Get API Keys

#### OpenAI (GPT-4o Vision + Whisper + TTS)
1. Go to https://platform.openai.com/api-keys
2. Create a new secret key
3. Make sure your account has GPT-4o access (check https://platform.openai.com/account/limits)
4. Copy key → `OPENAI_API_KEY=sk-...`

#### Google Gemini (Vision fallback)
1. Go to https://aistudio.google.com/app/apikey
2. Create API key
3. Copy → `GEMINI_API_KEY=AI...`

#### Anthropic Claude (Report generation)
1. Go to https://console.anthropic.com/
2. Create API key
3. Copy → `ANTHROPIC_API_KEY=sk-ant-...`

#### Google OAuth (for login)
1. Go to https://console.cloud.google.com/
2. Create project "cat-inspect-ai"
3. Enable Google+ API
4. OAuth 2.0 > Create credentials > OAuth client ID
5. Application type: iOS + Android (one each)
6. Copy Web client ID → `GOOGLE_CLIENT_ID=...`
7. Copy client secret → `GOOGLE_CLIENT_SECRET=...`

#### Google Cloud Storage (for GLB files)
1. Same GCP project
2. Enable Cloud Storage API
3. Create bucket: `cat-inspect-models` (multi-region, public)
4. Create service account key (JSON) → save as `gcp-key.json`
5. Set → `GCS_BUCKET=cat-inspect-models`

---

### STEP 3 — Configure Environment Variables

**`cat-inspect-backend/.env`**
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/cat_inspect

# Auth
JWT_SECRET=your-random-32-char-secret-here
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# AI
OPENAI_API_KEY=sk-proj-xxxxx
GEMINI_API_KEY=AIzaSyxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Storage
GCS_BUCKET=cat-inspect-models
GOOGLE_APPLICATION_CREDENTIALS=./gcp-key.json

# Server
PORT=4000
CLIENT_URL=http://localhost:8081
NODE_ENV=development
```

**`cat-inspect-app/.env`**
```env
EXPO_PUBLIC_API_URL=http://localhost:4000/api
EXPO_PUBLIC_GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
```

> ⚠️ For device testing replace `localhost` with your machine's LAN IP (e.g. `192.168.1.5`)

---

### STEP 4 — Set Up Database

```bash
cd cat-inspect-backend

# Create the database
psql -U postgres -c "CREATE DATABASE cat_inspect;"

# Run migrations (creates all tables)
npx prisma migrate dev --name init

# Optional: open Prisma Studio to view data
npx prisma studio
```

---

### STEP 5 — Add Your GLB Models

```bash
# Copy your GLB files into the app's assets
cp /path/to/cat320.glb   cat-inspect-app/assets/models/cat320.glb
cp /path/to/cat950.glb   cat-inspect-app/assets/models/cat950.glb
cp /path/to/catd6.glb    cat-inspect-app/assets/models/catd6.glb
cp /path/to/cat745.glb   cat-inspect-app/assets/models/cat745.glb
```

Then in `FleetScreen.tsx`, update the mock vehicles to include local GLB paths:
```typescript
// In src/hooks/useVehicles.ts — update MOCK_VEHICLES
const MOCK_VEHICLES: Vehicle[] = [
  {
    id: '1',
    name: 'CAT 320 Excavator',
    model: '320 GC',
    year: 2023,
    hours: '1,204',
    status: 'good',
    glbUrl: require('../../assets/models/cat320.glb'),  // local bundle
    // OR for remote: glbUrl: 'https://storage.googleapis.com/cat-inspect-models/cat320.glb'
  },
  // ...
];
```

---

### STEP 6 — Start the Backend

```bash
cd cat-inspect-backend
npm run dev
# Server running at http://localhost:4000
# WebSocket ready for real-time camera streaming
```

You should see:
```
╔══════════════════════════════════════════╗
║     CAT INSPECT AI — Server Running      ║
║     http://localhost:4000                ║
╚══════════════════════════════════════════╝
```

---

### STEP 7 — Start the React Native App

```bash
cd cat-inspect-app
npx expo start
```

Then press:
- `i` → Opens iOS Simulator (Mac only)
- `a` → Opens Android Emulator
- `w` → Opens in web browser (limited camera access)

**For physical device testing (recommended for camera):**
1. Install Expo Go on your phone (App Store / Play Store)
2. Scan the QR code shown in terminal
3. OR use `npx expo start --tunnel` if on a different network

---

### STEP 8 — Build for Production (Optional)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build iOS (requires Apple Developer account)
eas build --platform ios --profile preview

# Build Android APK
eas build --platform android --profile preview
```

---

## 🤖 HOW THE AI INTEGRATION WORKS

### Live Camera → GPT-4o Vision Pipeline

```
Physical device camera
        ↓
  takePictureAsync()          [expo-camera]
  (JPEG, base64, 0.7 quality)
        ↓
  POST /api/ai/analyze-frame  [axios]
        ↓
  GPT-4o Vision               [openai sdk]
  → Returns: severity, bounding boxes (x,y,w,h as %), voice message
        ↓
  AR Overlay renders           [react-native-svg]
  bounding box + line + label
        ↓
  expo-speech.speak()          [voice narration to inspector]
        ↓
  Finding saved to DB          [prisma + postgresql]
```

### Voice Control Pipeline

```
Inspector says "Hey CAT, mark as severe"
        ↓
  startListening()             [expo-av Audio.Recording]
  (records 4 seconds)
        ↓
  POST /api/ai/transcribe      [OpenAI Whisper]
  → Returns: "hey cat mark as severe"
        ↓
  Wake word check: "hey cat" ✓
        ↓
  POST /api/ai/voice-command   [GPT-4o Mini NLU]
  → Returns: { intent: "MARK_STATUS", params: { status: "severe" } }
        ↓
  onCommand() callback fires   [useVoiceControl hook]
  markItem("severe")
```

### Checklist from Photo/File

```
Inspector photographs paper checklist
        ↓
  launchCameraAsync()          [expo-image-picker]
        ↓
  POST /api/ai/extract-checklist  [GPT-4o Vision]
  → Returns: [{ id, section, label }, ...]
        ↓
  Checklist replaces DEFAULT_CHECKLIST
  Inspection follows custom items
```

### Report Generation

```
Inspection complete
        ↓
  POST /api/reports/generate
        ↓
  Claude Opus 4               [anthropic sdk]
  → executiveSummary, criticalIssues,
    recommendations, costEstimate, clearanceStatus
        ↓
  PDF generated with PDFKit   [pdfkit]
  Downloadable via /api/reports/:id/pdf
```

---

## 🧪 QUICK TEST — No Backend Needed

The app falls back to mock data if the backend is unreachable:
- Mock vehicles with emoji placeholders (no GLB)
- Mock AI findings for each checklist item
- Report generates from mock data

To test without any setup, just run `npx expo start --web` and you'll see the full UI flow.

---

## 🏆 DEMO SCRIPT FOR JUDGES (5 minutes)

| Time | Action |
|------|--------|
| 0:00 | Launch app → CAT splash animation |
| 0:10 | Tap "Continue with Google" → Fleet dashboard |
| 0:20 | Show 3D carousel (swipe/arrows) — vehicles with status badges |
| 0:35 | Tap "⚡ INSPECT NOW" on CAT 320 |
| 0:45 | Setup: tap "Use Template" → checklist loads ✓ |
| 0:55 | Select "LIVE AI CAMERA" → tap Begin |
| 1:05 | Show camera feed → point at any object |
| 1:15 | Tap "📸 CAPTURE & ANALYZE" — AI identifies issue + AR overlay appears |
| 1:30 | Say "Hey CAT, mark as severe" → voice command executes |
| 1:45 | Show checklist panel filling up with green/orange/red |
| 2:00 | Tap "GENERATE REPORT →" |
| 2:10 | Show color-coded report with AI narrative |
| 2:20 | Tap "⬇ EXPORT PDF" |
| 2:30 | Q&A |

---

## 🛠️ TROUBLESHOOTING

**Camera not working in simulator**
→ Use a physical device. iOS Simulator has no camera hardware.

**"Module not found: three"**
→ Run `npm install three @types/three` in the app directory.

**GPT-4o returning errors**
→ Check your OpenAI account has GPT-4o access. Use `gpt-4-turbo` as fallback in `aiService.js`.

**GLB model not rendering**
→ Make sure the GLB is valid (open in Blender or https://sandbox.babylonjs.com/). React Three Fiber requires valid GLTF 2.0.

**Socket.io connection refused**
→ Make sure backend is running. If testing on device, use your machine's LAN IP not `localhost`.

**Prisma migration fails**
→ Ensure PostgreSQL is running: `pg_ctl start` or `brew services start postgresql@15`

**Android camera permission denied**
→ Go to Settings → Apps → CAT Inspect AI → Permissions → Enable Camera

---

## 📦 WHAT TO COMMIT FOR THE HACKATHON

```
✓ cat-inspect-app/   (all source files)
✓ cat-inspect-backend/  (all source files)
✓ README.md
✗ .env files         (add to .gitignore)
✗ node_modules/      (add to .gitignore)
✗ gcp-key.json       (never commit!)
✗ *.glb files        (too large — host on GCS)
```

---

## 📋 .gitignore

```
# Both directories
node_modules/
.env
*.env.local
dist/
build/

# Backend specific
gcp-key.json
prisma/migrations/

# RN specific
.expo/
ios/Pods/
android/.gradle/
*.jks
*.p8
*.p12
*.key
*.mobileprovision

# GLB models (host externally)
assets/models/*.glb
```

---

*Built for HackIllinois 2026 · Caterpillar Digital Track*
*AI for Real-World Impact + Visual Parts Identification*
