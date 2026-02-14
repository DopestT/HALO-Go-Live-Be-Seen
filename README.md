# HALO - Go Live, Be Seen

[![TypeScript](https://img.shields.io/badge/TypeScript-5.1-blue.svg)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.72.6-61DAFB.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~49.0-000020.svg)](https://expo.dev/)
[![Go](https://img.shields.io/badge/Go-1.24-00ADD8.svg)](https://golang.org/)

A social livestreaming platform built with React Native and Go backend.

---

## 📱 Project Structure

This repository contains both the mobile application and backend services:

```
HALO-Go-Live-Be-Seen/
├── src/                    # Main React Native app (PRIMARY)
│   ├── api/               # API integrations (LiveKit, webhooks)
│   ├── components/        # Reusable UI components
│   ├── constants/         # Theme, colors, design system
│   ├── contexts/          # React contexts (Auth, etc.)
│   ├── navigation/        # Navigation configuration
│   ├── screens/           # App screens
│   ├── ui/                # UI components
│   └── utils/             # Utility functions
├── halo-app/              # Alternative/experimental app structure
├── backend/               # Go backend service
│   └── src/              # Go source files
├── __tests__/            # Jest test files
└── assets/               # Static assets

```

**Note:** The `src/` directory at the root contains the primary React Native application. The `halo-app/` directory is an alternative structure that may be consolidated in the future.

---

## 🎨 Design System

HALO follows a strict design philosophy:

- **Theme**: Void Black (#000000) background with glassmorphism UI
- **Geometry**: Rounded corners only (radius: 24px)
- **Typography**: Tabular numbers for consistency
- **Component**: All UI containers use the `GlassPanel` component
- **Safety**: All stream features include Report and Block utilities
- **Adult Mode**: Content filtering via `filterContentForUser` utility

See `src/constants/theme.ts` for the complete design system.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Expo CLI: `npm install -g expo-cli`
- For backend: Go 1.24+
- For iOS: Xcode 14+
- For Android: Android Studio

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DopestT/HALO-Go-Live-Be-Seen.git
   cd HALO-Go-Live-Be-Seen
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your LiveKit, Stripe, and database credentials
   ```

4. **Run the app:**
   ```bash
   npm start           # Start Expo dev server
   npm run android     # Run on Android
   npm run ios         # Run on iOS
   npm run web         # Run in web browser
   ```

### Backend Setup

The Go backend provides API services for the mobile app:

```bash
cd backend
go run src/main.go  # Or use the Makefile
```

See `backend/README.md` for detailed backend documentation.

---

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run TypeScript type checking:

```bash
npx tsc --noEmit
```

---

## 🔑 Environment Variables

Required environment variables (see `.env.example`):

- `LIVEKIT_API_KEY` - LiveKit API key for video streaming
- `LIVEKIT_API_SECRET` - LiveKit API secret
- `LIVEKIT_URL` - LiveKit server URL
- `STRIPE_SECRET_KEY` - Stripe secret key for payments
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `DATABASE_URL` - PostgreSQL database connection string

---

## 📦 Key Features

- **Livestreaming**: Powered by LiveKit for real-time video streaming
- **Authentication**: Age verification and adult mode gating
- **Payments**: Stripe integration for in-app purchases
- **Design**: Glassmorphism UI with void black theme
- **Safety**: Built-in content filtering and moderation tools

---

## 🛠️ Tech Stack

**Frontend:**
- React Native 0.72.6
- Expo SDK ~49.0
- TypeScript 5.1
- React Navigation
- LiveKit Client

**Backend:**
- Go 1.24
- Gin Web Framework
- PostgreSQL
- Redis

---

## 📝 Development Workflow

1. Create a feature branch from `main`
2. Make your changes following the design system guidelines
3. Run tests and TypeScript checks
4. Submit a pull request
5. Code review and merge

---

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🔗 Links

- [Project Homepage](https://halo-go-live-be-seen.vercel.app)
- [Documentation](./DOCUMENTATION_INDEX.md) (if available)
- [LiveKit Documentation](https://docs.livekit.io/)

---

## ⚠️ Known Issues

- Root `package.json` and `halo-app/package.json` need consolidation
- Some TypeScript errors in optional features (express, livekit-server-sdk)
- One failing test in `filterContentForUser` (pre-existing)

See open issues and pull requests for details on ongoing work.

---

## 🙏 Acknowledgments

Built with ❤️ by the HALO team
