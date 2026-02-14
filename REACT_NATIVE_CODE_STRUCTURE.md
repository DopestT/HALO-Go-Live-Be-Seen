# HALO React Native Code Structure

## Overview

This repository contains **TWO separate React Native applications**:

1. **Root App** (Legacy/Demo) - Located at repository root
2. **halo-app** (Production/Active) - Located in `/halo-app/` directory

---

## 1. Root Application (Legacy/Demo)

### Location
`/home/runner/work/HALO-Go-Live-Be-Seen/HALO-Go-Live-Be-Seen/`

### Technology Stack
- **Framework:** Expo 49.0.15
- **React Native:** 0.72.6
- **React:** 18.2.0
- **TypeScript:** 5.1.3
- **Navigation:** React Navigation v6 (Stack Navigator)

### Key Dependencies
```json
{
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/stack": "^6.3.20",
  "react-native-screens": "~3.25.0",
  "react-native-safe-area-context": "4.6.3",
  "react-native-gesture-handler": "~2.12.0"
}
```

### Entry Point
**`App.tsx`**
```typescript
- AuthProvider wraps entire app
- Simple conditional rendering: authenticated ? DiscoveryFeed : LoginScreen
- Uses SafeAreaProvider for safe areas
```

### Directory Structure

#### `/src/screens/`
- **`LoginScreen.tsx`** - Glassmorphism login UI
- **`DiscoveryFeed.tsx`** - Low-density content feed
- **`LiveStreamDemo.tsx`** - Demo screen for livestream overlay
- **`main/`** - Main app screens
  - `Dashboard.tsx`
  - `HomeScreen.tsx`
  - `PayoutHistory.tsx`
  - `WalletScreen.tsx`
  - `ProfileSettings.tsx`
- **`stream/`** - Livestream-related screens
  - `LiveRoom.tsx` (formerly "Live room.tsx" - renamed to fix spaces)
  - `GoLiveFlow.tsx`

#### `/src/components/`
- **`LiveStreamOverlay.tsx`** - Stream viewing with one-tap reporting
- **`ui/GlassPanel.tsx`** - Glassmorphism panel component
- Other UI components

#### `/src/contexts/`
- **`AuthContext.tsx`** - Authentication state management
  - User state management
  - Login/logout functionality
  - Adult Mode toggle
  - Age tracking

#### `/src/navigation/`
- **`RootNavigator.tsx`** - Root navigation setup
- **`MainTabNavigator.tsx`** - Tab navigation for main app

#### `/src/api/`
- **`livekit/`** (formerly "live kit/" - renamed to remove spaces)
  - `token.ts` - LiveKit token generation with environment variable validation

#### `/src/utils/`
- **`filterContentForUser.ts`** - Adult Mode content gating
  - Adult content filtering
  - Age verification
  - Safe defaults for unauthenticated users

#### `/src/constants/`
- **`theme.ts`** - Design system
  - Void Black color palette (#000000)
  - Consistent spacing scale (4-48px)
  - Border radius values (8-20px)
  - Typography with tabular numbers
  - Glassmorphism settings

### Design Philosophy
- **Void Black aesthetic** - #000000 primary background
- **Rounded geometry** - 8-20px border radius
- **Tabular numbers** - fontVariant: ['tabular-nums']
- **Glassmorphism effects** - Semi-transparent panels
- **Low-density layouts** - Generous spacing
- **No neon colors or gaming HUDs**
- **Calm, professional copy** - No urgency-based language

---

## 2. halo-app (Production/Active)

### Location
`/home/runner/work/HALO-Go-Live-Be-Seen/HALO-Go-Live-Be-Seen/halo-app/`

### Technology Stack
- **Framework:** Expo 50.0.0 (newer)
- **React Native:** 0.73.4 (newer)
- **React:** 18.2.0
- **TypeScript:** 5.1.3
- **Navigation:** React Navigation (Stack + Tabs)
- **Animation:** React Native Reanimated ~3.6.0
- **LiveKit:** livekit-client ^1.15.0

### Key Dependencies
```json
{
  "expo": "~50.0.0",
  "expo-blur": "~12.9.0",
  "expo-haptics": "~12.8.0",
  "expo-linear-gradient": "~12.7.0",
  "expo-font": "~11.10.0",
  "react": "18.2.0",
  "react-native": "0.73.0",
  "react-native-reanimated": "~3.6.0",
  "react-native-svg": "14.1.0",
  "livekit-client": "^1.15.0"
}
```

### Entry Point
**`halo-app/App.tsx`**
```typescript
- AuthProvider wraps app
- StreamProvider for LiveKit integration
- RootStack navigation
- More sophisticated navigation setup than root app
```

### Directory Structure

#### `/halo-app/src/screens/`
- **`HomeScreen.tsx`** - Main home screen
- **`OnboardingScreen.tsx`** - User onboarding
- **`LiveRoomScreen.tsx`** - LiveKit-powered live streaming room

#### `/halo-app/src/components/`
- **`HaloButton.tsx`** - Custom button component
- **`GlassPanel.tsx`** - Glassmorphism panel component
- **`index.ts`** - Component exports

#### `/halo-app/src/contexts/`
- **`AuthContext.tsx`** - Authentication context
- **`StreamContext.tsx`** - LiveKit stream management
- **`index.ts`** - Context exports

#### `/halo-app/src/navigation/`
- **`RootStack.tsx`** - Stack navigator setup
- **`AppTabs.tsx`** - Bottom tab navigation
- **`index.ts`** - Navigation exports

#### `/halo-app/src/utils/`
- **`safety.ts`** - Safety utilities (Report & Block)
- **`formatters.ts`** - Formatting utilities
- **`index.ts`** - Utility exports

#### `/halo-app/src/constants/`
- **`theme.ts`** - Design system (matches root app philosophy)
- **`colors.ts`** - Color constants
- **`config.ts`** - App configuration
- **`index.ts`** - Constant exports

### Key Differences from Root App
1. **Newer Dependencies** - Expo 50 vs 49, React Native 0.73 vs 0.72
2. **LiveKit Integration** - StreamContext and LiveRoomScreen
3. **More Sophisticated Navigation** - Both Stack and Tab navigators
4. **Better Organization** - Cleaner folder structure with index files
5. **Enhanced UI** - Uses expo-blur, expo-haptics, expo-linear-gradient
6. **Animation Support** - React Native Reanimated integration

---

## Backend Components

### Go Backend
Located in `/backend/` directory
- Contains Go-based backend services
- Supports livestream functionality

### Python Dashboard
- **`dashboard_terminal.py`** - Crypto terminal dashboard
- **`crypto_terminal`** - Related crypto terminal files

---

## Testing

### Test Infrastructure
- **Framework:** Jest 29.2.1
- **Testing Library:** @testing-library/react-native 12.3.2
- **Location:** `__tests__/` directory

### Existing Tests
- **`filterContentForUser.test.ts`** - Unit tests for content filtering

### Test Configuration
- **`jest.config.js`** - Jest configuration
- **`jest.setup.js`** - Jest setup file

---

## Build & Development Scripts

### Root App
```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "test": "jest"
}
```

### halo-app
```json
{
  "start": "expo start",
  "android": "expo run:android",
  "ios": "expo run:ios"
}
```

---

## Known Issues (From PR Analysis)

### Resolved in PRs (Not Yet Merged)

1. **File Naming Issues (PR #7)**
   - Fixed: `src/api/live kit/` → `src/api/livekit/` (spaces removed)
   - Fixed: `Live room.tsx` → `LiveRoom.tsx`

2. **Jest Naming Collision (PR #9)**
   - Fixed: Renamed halo-app package to `halo-app-alternate`
   - Fixed: Removed duplicate AuthContext implementation (84 lines)

3. **Compilation Errors (PR #14)**
   - Fixed: Duplicate package.json content
   - Fixed: Duplicate AuthContext implementations
   - Fixed: Import path for AgeGateScreen
   - Fixed: Undefined references in stripe.ts

### Open Issues

1. **Duplicate Code Structure**
   - Two React Native apps with similar but different purposes
   - Some code duplication between root and halo-app

2. **Environment Configuration**
   - Environment variables need proper `.env` setup
   - LiveKit API keys required

3. **Database Integration**
   - `db` references commented out with TODOs
   - Backend integration incomplete

---

## Recommended Structure (Future)

Several PRs (#15, #16) propose restructuring:

### Option 1: Frontend/Backend/Docs
```
frontend/          # React Native app
backend/           # Go services
docs/              # Documentation
```

### Option 2: Monorepo
```
packages/
  ├── mobile/      # React Native app
  ├── backend/     # Go services
  └── shared/      # Shared utilities
```

---

## Security & Safety Features

### Content Safety
- **Adult Mode** - Age-gated content filtering
- **filterContentForUser** - Utility for content moderation
- **Report & Block** - User safety utilities (referenced in halo-app)

### Environment Security
- Environment variables for API keys
- No hardcoded credentials
- CodeQL scanning enabled

---

## Dependencies Management

### Package Naming Issue
- Root `package.json` and `halo-app/package.json` had naming conflict
- Fixed in PR #9 by renaming halo-app package

### Duplicate Dependencies
Both apps have similar but slightly different dependency versions, which could lead to:
- Larger repository size
- Potential version conflicts
- Maintenance overhead

---

## Platforms Supported

All React Native apps support:
- **iOS** - via `expo run:ios` or `expo start --ios`
- **Android** - via `expo run:android` or `expo start --android`
- **Web** - via `expo start --web` (root app only in scripts)

---

## Next Steps & Recommendations

1. **Decide on Structure**
   - Choose one React Native app as primary
   - Either merge features or clearly separate demo vs production
   - Consider monorepo structure (PR #16)

2. **Merge Critical Fixes**
   - PR #7: File naming fixes
   - PR #9: Jest collision and AuthContext cleanup
   - PR #14: Compilation errors

3. **Resolve Package Issues**
   - Consolidate or clearly separate package.json files
   - Standardize dependency versions

4. **Complete Backend Integration**
   - Implement database layer
   - Connect LiveKit properly
   - Setup environment configuration

5. **Documentation**
   - Add setup instructions
   - Document environment variables
   - Create contribution guidelines

---

## Summary

This repository contains a sophisticated React Native application built with Expo, featuring:
- Dual app structure (root legacy + halo-app production)
- Glassmorphism design with Void Black aesthetic
- LiveKit integration for livestreaming
- Comprehensive authentication and content filtering
- Go backend services
- Strong focus on safety and security

The codebase is functional but has organizational challenges that several open PRs attempt to address. The primary decision needed is whether to consolidate the two apps or maintain them separately with clear purposes.
