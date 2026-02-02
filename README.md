# HALO — Go Live, Be Seen

## 1. Project Essence
HALO is a social networking platform focused on "Presence over Performance." It utilizes a calm, guardian-like aesthetic to provide safe, intentional live streaming.

## 2. Design Architecture (LOCKED)
- **Aesthetic:** Dark-first, Void Black (#020617), Glassmorphism, and Soft Glow accents.
- **Typography:** Inter/SF Pro with Tabular Numbers.
- **Principles:** Presence > Performance, Calm > Chaos, Soft Status (No leaderboards).

## 3. Core Tech Stack
- **Frontend:** React Native (Expo)
- **Streaming:** LiveKit SDK
- **Backend:** Node.js + TypeScript + PostgreSQL
- **Payments:** Apple IAP / Google Billing (In-app), Stripe (Payouts)

## 4. Adult Mode (Non-Negotiable)
Adult Mode is disabled by default and requires:
1. Explicit Opt-in.
2. Age Verification (18+).
3. Content tagging during "Go Live" flow.
Note: Adult content never appears in thumbnails and is gated behind a 18+ label.

## 5. Environment Setup
Create a `.env` file in the root directory with the following keys:
`LIVEKIT_API_KEY=`
`LIVEKIT_API_SECRET=`
`STRIPE_SECRET_KEY=`
`EXPO_PROJECT_ID=`
`FIREBASE_CONFIG_JSON=`

## 6. Development
`npm install`
`npx expo start`

