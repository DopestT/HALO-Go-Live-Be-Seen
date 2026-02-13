# HALO - Go Live, Be Seen

A monorepo containing the HALO platform: a livestreaming social network with React Native mobile app and Go backend.

---

## Repository Structure

```
HALO-Go-Live-Be-Seen/
├── halo-app/              # React Native mobile application
│   ├── src/               # App source code
│   ├── assets/            # Images, fonts, and static assets
│   ├── App.tsx            # Application entry point
│   └── package.json       # Frontend dependencies
├── backend/               # Go backend services
│   ├── cmd/               # Application entry points
│   ├── internal/          # Internal packages
│   ├── pkg/               # Public packages
│   ├── migrations/        # Database migrations
│   └── Makefile           # Build commands
├── IMPLEMENTATION_SUMMARY.md  # Feature implementation details
├── VERIFICATION.md            # Implementation verification
└── package.json               # Monorepo configuration
```

---

## Quick Start

### Mobile App

1. Navigate to the app directory:
   ```bash
   cd halo-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Follow the Expo instructions to run on iOS, Android, or web.

For detailed app documentation, see [halo-app/README.md](halo-app/README.md).

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Build and run:
   ```bash
   make build
   make run
   ```

For detailed backend documentation, see [backend/README.md](backend/README.md).

---

## Monorepo Scripts

From the root directory:

- `npm run app` - Start the mobile app development server
- `npm run app:install` - Install mobile app dependencies
- `npm run backend` - Run the backend server
- `npm run backend:build` - Build the backend
- `npm test` - Run mobile app tests

---

## Design Principles

- **Aesthetic:** Dark-first, Void Black, Glassmorphism
- **Typography:** Rounded geometry (radius: 24), tabular numbers
- **Philosophy:** Presence over Performance, Calm over Chaos
- **Safety:** All features include Report and Block utilities
- **Adult Mode:** 18+ content is properly gated with age verification

---

## Documentation

- [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - Feature checklist and architecture
- [Verification](VERIFICATION.md) - Implementation verification details
- [App README](halo-app/README.md) - Mobile app documentation
- [Backend Architecture](backend/ARCHITECTURE.md) - Backend design and structure
- [Backend Integration](backend/INTEGRATION.md) - API integration guide
