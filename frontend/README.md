# HALO App

React Native application for HALO - Go Live, Be Seen platform.

## Structure

```
halo-app/
├── assets/
│   ├── fonts/           # Inter-Regular.ttf, Inter-Bold.ttf
│   └── images/          # App icons and assets
├── src/
│   ├── components/      # Reusable UI (GlassPanel, HaloButton)
│   ├── constants/       # Theme, Colors, Config
│   ├── contexts/        # AuthContext, StreamContext
│   ├── screens/         # Onboarding, Home, LiveRoom
│   ├── navigation/      # RootStack, AppTabs
│   └── utils/           # Safety checks, formatters
├── App.tsx              # Entry Point
└── package.json         # Dependencies
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Download Inter font files:
   - Download from [Google Fonts](https://fonts.google.com/specimen/Inter)
   - Place `Inter-Regular.ttf` and `Inter-Bold.ttf` in `assets/fonts/`

3. Start the development server:
```bash
npx expo start
```

## Design Principles

- **Aesthetic:** Dark-first, Void Black (#020617), Glassmorphism, Soft Glow
- **Typography:** Inter with rounded geometry (radius: 24)
- **Philosophy:** Presence over Performance, Calm over Chaos
- **Safety:** All stream features include Report and Block utilities
- **Adult Mode:** 18+ content is gated and requires age verification

## Key Components

### GlassPanel
Main UI container component with glassmorphism aesthetic. Always uses rounded borders (radius: 24).

### HaloButton
Standard button component with calm, soft styling.

### Safety Utilities
- `filterContentForUser` - Must be used when fetching feeds
- `reportContent` - Report streams, users, or messages
- `blockUser` - Block users

## Environment Variables

Create a `.env` file:
```
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```
