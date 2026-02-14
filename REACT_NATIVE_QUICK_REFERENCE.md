# HALO React Native Code - Quick Reference

## 🚀 Quick Start

### Root App (Legacy/Demo)
```bash
cd /home/runner/work/HALO-Go-Live-Be-Seen/HALO-Go-Live-Be-Seen
npm start        # Start Expo
npm run android  # Run on Android
npm run ios      # Run on iOS
```

### halo-app (Production)
```bash
cd /home/runner/work/HALO-Go-Live-Be-Seen/HALO-Go-Live-Be-Seen/halo-app
npm start        # Start Expo
npm run android  # Run on Android
npm run ios      # Run on iOS
```

---

## 📂 Key React Native Files

### Root App - Entry Points
| File | Purpose |
|------|---------|
| `App.tsx` | Main app entry point |
| `index.js` | Expo entry point |
| `package.json` | Root package config |

### Root App - Core Files
| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `src/screens/` | All screens | `LoginScreen.tsx`, `DiscoveryFeed.tsx`, `LiveStreamDemo.tsx` |
| `src/components/` | UI components | `LiveStreamOverlay.tsx`, `ui/GlassPanel.tsx` |
| `src/contexts/` | React contexts | `AuthContext.tsx` |
| `src/navigation/` | Navigation setup | `RootNavigator.tsx`, `MainTabNavigator.tsx` |
| `src/constants/` | Design system | `theme.ts` |
| `src/utils/` | Utilities | `filterContentForUser.ts` |
| `src/api/` | API integrations | `livekit/token.ts` |

### halo-app - Entry Points
| File | Purpose |
|------|---------|
| `halo-app/App.tsx` | App entry point |
| `halo-app/package.json` | Package config |

### halo-app - Core Files
| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `src/screens/` | All screens | `HomeScreen.tsx`, `OnboardingScreen.tsx`, `LiveRoomScreen.tsx` |
| `src/components/` | UI components | `HaloButton.tsx`, `GlassPanel.tsx` |
| `src/contexts/` | React contexts | `AuthContext.tsx`, `StreamContext.tsx` |
| `src/navigation/` | Navigation setup | `RootStack.tsx`, `AppTabs.tsx` |
| `src/constants/` | Constants | `theme.ts`, `colors.ts`, `config.ts` |
| `src/utils/` | Utilities | `safety.ts`, `formatters.ts` |

---

## 🎨 Design System (theme.ts)

### Location
- Root: `/src/constants/theme.ts`
- halo-app: `/halo-app/src/constants/theme.ts`

### Key Principles
```typescript
// Colors
Void Black: #000000        // Primary background
Glass colors with opacity  // Semi-transparent UI

// Geometry
Border Radius: 8-20px      // Always rounded
Spacing: 4-48px scale      // Consistent spacing

// Typography
fontVariant: ['tabular-nums']  // Tabular numbers throughout
```

### DO NOT
- ❌ Use neon colors
- ❌ Use gaming HUD elements
- ❌ Use urgency-based copy
- ❌ Use hard borders
- ❌ Use sharp corners

### DO
- ✅ Use Void Black (#000000)
- ✅ Use rounded geometry (radius: 24)
- ✅ Use GlassPanel component
- ✅ Use calm, respectful copy
- ✅ Reference Report & Block utilities for safety features

---

## 🔐 Authentication

### AuthContext Location
- Root: `/src/contexts/AuthContext.tsx`
- halo-app: `/halo-app/src/contexts/AuthContext.tsx`

### Key Features
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  toggleAdultMode: () => void;
  age?: number;
}
```

### Adult Mode & Content Filtering
```typescript
// Use filterContentForUser utility
import { filterContentForUser } from '../utils/filterContentForUser';

const filteredContent = filterContentForUser(allContent, user);
```

---

## 📱 Navigation

### Root App
- Stack-based with conditional rendering
- `RootNavigator.tsx` - Main navigation
- `MainTabNavigator.tsx` - Tab navigation

### halo-app
- Combined Stack + Tab navigation
- `RootStack.tsx` - Stack navigator
- `AppTabs.tsx` - Bottom tabs

---

## 🎥 LiveStreaming

### LiveKit Integration
- **Root:** `/src/api/livekit/token.ts`
- **halo-app:** Has StreamContext.tsx for LiveKit

### Environment Variables Required
```bash
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

### Usage
```typescript
// halo-app example
import { useStream } from '../contexts/StreamContext';

const { joinRoom, leaveRoom, isConnected } = useStream();
```

---

## 🛡️ Safety Features

### Report & Block (halo-app only)
```typescript
import { Report, Block } from '../utils/safety';
```

### Content Filtering (Root)
```typescript
import { filterContentForUser } from '../utils/filterContentForUser';

// Filters content based on:
// - User authentication
// - Adult Mode setting
// - Age verification (18+)
```

---

## 🧪 Testing

### Location
- Tests: `__tests__/`
- Config: `jest.config.js`
- Setup: `jest.setup.js`

### Existing Tests
- `filterContentForUser.test.ts` - Content filtering tests

### Note
Jest config exists in root but test script is not in package.json.
Add to package.json if needed:
```json
{
  "scripts": {
    "test": "jest"
  }
}
```

---

## 🔧 Common Issues & Fixes

### Issue: Module not found - "live kit"
**Fix:** Spaces in directory names  
**PR:** #7 renames `src/api/live kit/` → `src/api/livekit/`

### Issue: Jest Haste module collision
**Fix:** Package naming conflict  
**PR:** #9 renames halo-app package to `halo-app-alternate`

### Issue: TypeScript compilation errors
**Fix:** Duplicate code in files  
**PR:** #14 removes duplicate implementations

### Issue: Cannot find AgeGateScreen
**Fix:** Wrong import path  
**PR:** #14 fixes `../screens/auth/AgeGateScreen` → `../screens/with/AgeGateScreen`

---

## 📦 Dependencies

### Root App
```json
{
  "expo": "~49.0.15",
  "react-native": "0.72.6",
  "react": "18.2.0",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/stack": "^6.3.20"
}
```

### halo-app
```json
{
  "expo": "~50.0.0",
  "react-native": "0.73.0",
  "react": "18.2.0",
  "livekit-client": "^1.15.0",
  "react-native-reanimated": "~3.6.0"
}
```

### Note
Different versions between root and halo-app - be aware when sharing code.

---

## 🚨 Known Issues in Main Branch

1. **Two React Native apps** - Decision needed on primary app
2. **File naming with spaces** - Breaks module resolution (fix in PR #7)
3. **Jest collision** - Package naming conflict (fix in PR #9)
4. **Duplicate code** - Merged duplicates (fix in PR #14)
5. **Missing .env** - Environment variables needed
6. **Incomplete backend** - `db` references commented out

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Crypto terminal dashboard info |
| `IMPLEMENTATION_SUMMARY.md` | Feature implementation summary |
| `VERIFICATION.md` | Verification steps |
| `REACT_NATIVE_CODE_STRUCTURE.md` | Comprehensive code structure (new) |
| `PULL_REQUEST_RESOLUTION_SUMMARY.md` | PR analysis (new) |

---

## 🎯 Next Steps

1. **For Development:**
   - Decide: Root app vs halo-app as primary
   - Merge PR #7 (file naming fixes)
   - Merge PR #14 (compilation fixes)
   - Setup .env file with LiveKit credentials

2. **For Understanding the Code:**
   - Read: `REACT_NATIVE_CODE_STRUCTURE.md`
   - Review: `src/constants/theme.ts` for design system
   - Check: `src/contexts/AuthContext.tsx` for auth flow

3. **For Contributing:**
   - Read: `PULL_REQUEST_RESOLUTION_SUMMARY.md`
   - Follow design principles from theme.ts
   - Use GlassPanel for all UI containers
   - Include Report & Block for safety features

---

## 🔍 Quick File Lookup

Need to find...
- **Theme/colors?** → `src/constants/theme.ts`
- **Authentication?** → `src/contexts/AuthContext.tsx`
- **Content filtering?** → `src/utils/filterContentForUser.ts`
- **LiveKit integration?** → `src/api/livekit/token.ts` or `halo-app/src/contexts/StreamContext.tsx`
- **Main screens?** → `src/screens/` or `halo-app/src/screens/`
- **UI components?** → `src/components/` or `halo-app/src/components/`
- **Navigation?** → `src/navigation/` or `halo-app/src/navigation/`

---

## 💡 Tips

1. **GlassPanel is your friend** - Use it for all UI containers to maintain glassmorphism
2. **Check Adult Mode** - Always use `filterContentForUser` when showing feeds
3. **Tabular numbers** - Use `fontVariant: ['tabular-nums']` for numbers
4. **Rounded everything** - Minimum border radius is 8px, prefer 24px
5. **Safety first** - Reference Report and Block utilities for all user-generated content

---

## 🔗 Related Files

For backend integration:
- Go backend: `/backend/`
- API webhooks: `/src/api/webhooks/`
- Environment config: `.env` (to be created)

---

**Last Updated:** 2026-02-14  
**Version:** 1.0  
**Maintainer:** GitHub Copilot Agent
