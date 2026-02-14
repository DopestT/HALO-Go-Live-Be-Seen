# Repository Structure Guide

## Overview

This repository contains a React Native mobile application for the HALO livestreaming platform, along with a Go backend service.

## Directory Structure

### Primary Application: `/src`

The **main application** lives in the root `/src` directory. This is the primary codebase that should be used for development.

**Key directories:**
- `src/api/` - API integration code (LiveKit tokens, webhooks)
- `src/components/` - Reusable React components
- `src/constants/` - Theme, colors, and design system constants
- `src/contexts/` - React Context providers (AuthContext, etc.)
- `src/navigation/` - Navigation configuration and navigators
- `src/screens/` - Application screens organized by feature
- `src/ui/` - UI-specific components
- `src/utils/` - Utility functions and helpers

**Configuration files at root:**
- `package.json` - Main npm dependencies (Expo ~49.0, RN 0.72.6)
- `App.tsx` - Application entry point
- `tsconfig.json` - TypeScript configuration
- `babel.config.js` - Babel configuration
- `jest.config.js` - Jest test configuration

### Alternative Structure: `/halo-app`

The `/halo-app` directory contains an **alternative/experimental application structure**. 

**Current status:** This appears to be either:
- An older iteration of the app
- An experimental rewrite
- A parallel development branch

**Key differences:**
- Uses newer Expo SDK (~50.0) and React Native (0.73.4)
- Has its own `package.json` with different dependencies
- Includes LiveKit React Native SDK
- Has separate ESLint configuration
- Contains similar but not identical screens and components

**Recommendation:** The `/halo-app` directory should either be:
1. Merged into the main `/src` application if it contains useful features
2. Removed if it's obsolete
3. Moved to a separate branch if it's experimental

### Backend: `/backend`

Go-based backend service providing API endpoints for the mobile application.

**Structure:**
- Written in Go 1.24
- Uses Gin web framework
- PostgreSQL database
- Redis for caching
- Docker support with Dockerfile and docker-compose.yml

### Other Directories

- `__tests__/` - Jest test files for the main application
- `assets/` - Static assets (images, fonts, etc.)
- `api/` - Additional API-related code (may need organization)
- `crypto_terminal/` - Unrelated crypto terminal dashboard (should be in separate repo)

## Which App to Use?

### For Development: Use `/src`

The root-level `/src` directory is the **primary application**:
- ✅ More complete feature set
- ✅ Active development
- ✅ Better tested
- ✅ Consistent with main package.json

### What About halo-app?

The `/halo-app` directory:
- ⚠️ May have newer dependencies
- ⚠️ Unclear purpose/status
- ⚠️ Creates Jest Haste module naming conflicts
- ⚠️ Needs decision: merge, remove, or branch

## Consolidation Plan

To clean up the repository structure, we should:

1. **Audit both applications**
   - Identify unique features in `/halo-app`
   - Determine if any code should be merged to `/src`

2. **Make a decision:**
   - **Option A:** Merge useful features from `/halo-app` into `/src`, then remove `/halo-app`
   - **Option B:** Make `/halo-app` the primary app and deprecate `/src`
   - **Option C:** Keep both but clearly document their purposes

3. **Clean up unrelated code:**
   - Move `crypto_terminal/` to a separate repository
   - Organize `api/` directory better

4. **Update documentation:**
   - Clear README with structure explanation
   - Migration guide if switching primary app
   - Development setup instructions

## Dependencies Overview

### Root Application (`/src`)
- Expo SDK: ~49.0.15
- React Native: 0.72.6
- React: 18.2.0
- TypeScript: 5.1.3
- Jest for testing

### halo-app
- Expo SDK: ~50.0.0
- React Native: 0.73.4
- React: 18.2.0
- TypeScript: 5.3.0
- LiveKit: ^1.4.0 (important for streaming!)
- Has ESLint configuration

### Backend
- Go: 1.24
- Gin web framework
- PostgreSQL
- Redis
- Docker support

## Development Recommendations

1. **Primary development:** Use `/src` directory
2. **New features:** Add to `/src` unless there's a compelling reason
3. **Dependencies:** Install at root level, not in `/halo-app`
4. **Tests:** Write tests in `__tests__/` for `/src` code
5. **Backend:** Keep backend separate in `/backend`

## Open Questions

1. What is the purpose of `/halo-app`?
2. Should we upgrade `/src` to use Expo 50 and RN 0.73.4?
3. Does `/halo-app` have LiveKit integration that `/src` needs?
4. Should we adopt the ESLint config from `/halo-app`?
5. Can we safely remove `crypto_terminal/` to a separate repo?

## Next Steps

- [ ] Decision on halo-app (see PR #15, #16 for restructuring proposals)
- [ ] Audit unique code in halo-app
- [ ] Create migration plan if needed
- [ ] Update main README with clear structure
- [ ] Clean up unrelated code
