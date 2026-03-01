<div align="center">

```
████████╗ ██████╗  ██████╗ ██╗         ███████╗██████╗ ███████╗ ██████╗████████╗███████╗██████╗
╚══██╔══╝██╔═══██╗██╔═══██╗██║         ██╔════╝██╔══██╗██╔════╝██╔════╝╚══██╔══╝██╔════╝██╔══██╗
   ██║   ██║   ██║██║   ██║██║         ███████╗██████╔╝█████╗  ██║        ██║   █████╗  ██████╔╝
   ██║   ██║   ██║██║   ██║██║         ╚════██║██╔═══╝ ██╔══╝  ██║        ██║   ██╔══╝  ██╔══██╗
   ██║   ╚██████╔╝╚██████╔╝███████╗    ███████║██║     ███████╗╚██████╗   ██║   ███████╗██║  ██║
   ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝    ╚══════╝╚═╝     ╚══════╝ ╚═════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
```

### **AI-Powered Heavy Equipment Inspection Platform**
#### *Built for the Caterpillar Track — Hackathon 2025*

<br/>

![CAT Yellow](https://img.shields.io/badge/CAT-Caterpillar_Track-FFCD11?style=for-the-badge&labelColor=000000&color=FFCD11)
![Claude AI](https://img.shields.io/badge/Claude-Sonnet_4-D4A017?style=for-the-badge&labelColor=1a1a1a&color=D97706)
![Three.js](https://img.shields.io/badge/Three.js-3D_Models-00ff88?style=for-the-badge&labelColor=111111&color=00C853)
![Web Speech](https://img.shields.io/badge/Voice-Controlled-4488FF?style=for-the-badge&labelColor=111111&color=3B82F6)

<br/>

> **ToolSpecter** turns any device into a fully autonomous CAT equipment inspector —
> real-time AI vision, voice commands, color-coded reports, and 3D fleet management.
> All in a single `.html` file.

<br/>

---

</div>

<br/>

## ⚡ What is ToolSpecter?

ToolSpecter is a **zero-install, browser-native AI inspection system** designed for Caterpillar field inspectors. Point your camera at any heavy equipment — excavators, bulldozers, dump trucks — and get instant AI-powered diagnostics with visual annotations, voice narration, and auto-generated reports.

Built as a hackathon MVP, it ships as a **single self-contained HTML file** with no build step, no dependencies to install, and no backend to deploy.

<br/>

---

## 🎬 Feature Walkthrough

<br/>

### `01` — Cinematic Splash Screen

```
┌─────────────────────────────────────┐
│                                     │
│          ██████╗ █████╗ ████████╗   │
│         ██╔════╝██╔══██╗╚══██╔══╝  │  ← CAT logo with
│         ██║     ███████║   ██║      │    pulsing yellow
│         ██║     ██╔══██║   ██║      │    glow animation
│         ╚██████╗██║  ██║   ██║      │
│          ╚═════╝╚═╝  ╚═╝   ╚═╝      │
│                                     │
│          T O O L S P E C T E R      │  ← Fades in, then
│      AI Vehicle Inspection System   │    fades out to app
│          ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░        │
└─────────────────────────────────────┘
```

<br/>

### `02` — 3D Fleet Dashboard

- Interactive **Three.js 3D models** rendered in real-time — no external assets needed
- Procedurally built meshes for: **Excavator · Bulldozer · Dump Truck · Wheel Loader · Motor Grader**
- Horizontal carousel with **infinite loop** navigation (arrows + dot indicators + keyboard)
- Add custom vehicles with your own `.glb` model files
- Fleet registry list with last inspection status

```
◁  [ CAT 390 EXCAVATOR — rotating 3D model ]  ▷
              ●  ○  ○  ○

   FLEET STATUS — 2 VEHICLES
   CAT 390 Excavator              [ ⚡ INSPECT ]  [ + ADD VEHICLE ]
```

<br/>

### `03` — AI Inspection with Live Annotations

Select your inspection input:

| Mode | Description |
|------|-------------|
| 📷 **Live Camera** | Real-time video stream with continuous AI analysis every 6 seconds |
| 🖼️ **Upload Image/Video** | Analyze existing media — photos from the field, dashcam footage |

**What the AI detects and draws on screen:**

```
┌──────────────────────────────────────────────┐
│                                              │
│   ┌──────────────────┐                       │
│   │ Hydraulic Boom   │ ← RED bounding box    │
│   │ Cylinder         │   + labeled line      │
│   └──────────────────┘   + severity dot      │
│                                              │
│              ┌────────────────┐              │
│              │  Bucket Teeth  │ ← ORANGE box │
│              └────────────────┘              │
│                                              │
│    ┌──────────────┐                          │
│    │ Track System │ ← GREEN box (OK)         │
│    └──────────────┘                          │
│                                              │
│  ════════════════════  ← AI scan line        │
└──────────────────────────────────────────────┘
```

<br/>

### `04` — Voice-Controlled Hands-Free Operation

> Built for inspectors wearing gloves who can't touch the screen.

**Wake word:** `"Hey Specter"` — then say any command:

```bash
"Hey Specter, start camera"       → Opens live camera
"Hey Specter, analyze"            → Triggers AI scan
"Hey Specter, start live"         → Begins continuous live analysis
"Hey Specter, generate report"    → Jumps to full report
"Hey Specter, next vehicle"       → Navigates fleet carousel
"Hey Specter, inspect"            → Opens inspection screen
"Hey Specter, go back"            → Navigates back
"Hey Specter, stop"               → Stops camera/analysis
```

The AI also **speaks its findings aloud** — narrating issues in plain language as it detects them, so the inspector never has to look at the screen.

<br/>

### `05` — Smart Checklist System

Upload your inspection checklist via:
- **Text / PDF file** → auto-parsed into interactive checklist items
- **Camera photo of paper checklist** → AI extracts items via vision
- **Default templates** → auto-loaded per vehicle type (10 items each)

Each item cycles through states: `Pending → ✓ Done → ⚠ Warning → ! Issue`

After AI analysis, checklist items are **automatically cross-referenced** with detected findings and marked accordingly.

<br/>

### `06` — Color-Coded Inspection Report

```
╔══════════════════════════════════════════════════════╗
║  INSPECTION REPORT                         CRITICAL  ║
║  CAT 390 Excavator · TS-K4X92A                       ║
╠══════════════════════════════════════════════════════╣
║   🔴  2  CRITICAL   🟡  2  MONITOR   🟢  1  GOOD     ║
╠══════════════════════════════════════════════════════╣
║  🔴 CRITICAL — IMMEDIATE ACTION                      ║
║  ┃ Hydraulic Boom Cylinder                           ║
║  ┃ Minor oil seepage at rod seal junction            ║
║  ┃ → Replace rod seal immediately                    ║
╠══════════════════════════════════════════════════════╣
║  🟡 CAUTION — SCHEDULE MAINTENANCE                   ║
║  ┃ Left Track Assembly                               ║
║  ┃ Excessive wear on drive sprocket teeth            ║
║  ┃ → Schedule replacement within 200 hours           ║
╠══════════════════════════════════════════════════════╣
║  [ 🖨️ PRINT ]  [ 📤 EXPORT ]  [ ← BACK ]            ║
╚══════════════════════════════════════════════════════╝
```

**Severity Scale:**

| Color | Label | Meaning |
|-------|-------|---------|
| 🔴 **RED** | CRITICAL | Immediate shutdown — safety risk |
| 🟡 **ORANGE** | CAUTION | Schedule maintenance soon |
| 🟢 **GREEN** | GOOD | Within normal operating parameters |

<br/>

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                     TOOLSPECTER STACK                   │
├─────────────────────┬───────────────────────────────────┤
│  AI VISION          │  Claude Sonnet (claude-sonnet-4)  │
│  3D RENDERING       │  Three.js r128                    │
│  VOICE INPUT        │  Web Speech API (SpeechRecog.)    │
│  VOICE OUTPUT       │  Web Speech API (SpeechSynth.)    │
│  CAMERA             │  MediaDevices.getUserMedia()      │
│  FONTS              │  Bebas Neue · Rajdhani · Share    │
│                     │  Tech Mono (Google Fonts)         │
│  DEPLOYMENT         │  Zero — single .html file         │
│  DEPENDENCIES       │  Zero install required            │
└─────────────────────┴───────────────────────────────────┘
```

<br/>

---

## 🚀 Getting Started

**That's it. Seriously.**

```bash
# Clone the repo
git clone https://github.com/your-username/toolspecter.git

# Open the file
open toolspecter.html
# or just double-click it in your file manager
```

> ✅ No `npm install` · ✅ No build step · ✅ No backend · ✅ Works offline (with mock AI)

<br/>

### Using Live AI Analysis

ToolSpecter calls the **Anthropic Claude API** for real vision analysis. To enable it:

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. The app calls `https://api.anthropic.com/v1/messages` directly from the browser
3. Or — just run it as-is. The **built-in fallback AI** generates realistic, vehicle-specific findings automatically for demo purposes.

<br/>

---

## 📁 Project Structure

```
toolspecter/
└── toolspecter.html          # The entire application — 2,400 lines
    ├── <style>               # All CSS — CAT industrial dark theme
    ├── Three.js (CDN)        # 3D engine loaded from cdnjs
    ├── Google Fonts (CDN)    # Bebas Neue, Rajdhani, Share Tech Mono
    └── <script>
        ├── State management  # Vanilla JS app state
        ├── Three.js engine   # Procedural 3D vehicle meshes
        ├── Screen router     # Splash → Dashboard → Inspect → Report
        ├── Camera system     # WebRTC live camera
        ├── AI analysis       # Claude Vision API + fallback
        ├── Annotation layer  # Bounding box overlay renderer
        ├── Voice control     # Wake-word + command parser
        ├── TTS engine        # AI speech synthesis
        ├── Checklist system  # Upload + AI extraction + state
        └── Report generator  # Full color-coded report builder
```

<br/>

---

## 🔑 Key Capabilities

| Capability | Status |
|------------|--------|
| 3D vehicle carousel with infinite loop | ✅ Live |
| Real-time camera inspection | ✅ Live |
| Claude Vision AI analysis | ✅ Live |
| Visual bounding box annotations | ✅ Live |
| AI voice narration of findings | ✅ Live |
| Wake-word voice commands ("Hey Specter") | ✅ Live |
| Checklist upload (file + camera) | ✅ Live |
| AI checklist extraction from photo | ✅ Live |
| Color-coded RED/ORANGE/GREEN report | ✅ Live |
| Print & export report | ✅ Live |
| GLB model support | 🔧 Extend Three.js GLTFLoader |
| Offline fallback AI | ✅ Live |
| Keyboard navigation | ✅ Live |

<br/>

---

## 🎨 Design System

```
Background    #000000  ██  Deep black
Surface       #0F0F0F  ██  Panel dark
Border        #1E1E1E  ██  Subtle edge

CAT Yellow    #FFCD11  ██  Primary accent — all CTAs, glows, labels
Critical      #FF3333  ██  RED severity
Caution       #FF8C00  ██  ORANGE severity
Good          #00E676  ██  GREEN severity

Typography
  Display     Bebas Neue      — All headers, labels, vehicle names
  Body        Rajdhani        — Descriptions, UI text
  Mono        Share Tech Mono — Technical data, IDs, status readouts
```

<br/>

---

## 

Built for the **Caterpillar Track** at a 2025 hackathon. The vision: eliminate paper-based inspection checklists and give every field inspector a superpower — AI eyes that never miss a crack, a leak, or a worn sprocket tooth.

**Core problem solved:**
> CAT equipment inspectors spend hours manually documenting issues, often in harsh field conditions, sometimes wearing gloves, sometimes in low light. Reports are inconsistent, delays cause downtime, and critical issues get missed.

**ToolSpecter's answer:**
> Point. Speak. Done. AI sees it, says it, reports it.

<br/>

---

## 🔮 Roadmap (Post-MVP)

- [ ] Native React Native app (iOS + Android)
- [ ] Real GLB model loading with GLTF loader
- [ ] Cloud sync — inspection history across devices
- [ ] Custom fine-tuned vision model on CAT equipment damage datasets
- [ ] Integration with CAT's equipment management APIs
- [ ] Offline-first PWA with local AI (on-device model)
- [ ] Multi-inspector collaboration on same inspection
- [ ] AR overlay mode for spatial annotation

<br/>

---

<div align="center">

**Built with 🟡 and Claude AI**

*ToolSpecter — See More. Miss Nothing.*

<br/>

![Made at Hackathon](https://img.shields.io/badge/Made_at-Hackathon_2025-FFCD11?style=flat-square&labelColor=000000)
![Powered by Claude](https://img.shields.io/badge/Powered_by-Claude_AI-D97706?style=flat-square&labelColor=111111)
![CAT Track](https://img.shields.io/badge/Caterpillar-Track_Entry-FFCD11?style=flat-square&labelColor=000000)

</div>
