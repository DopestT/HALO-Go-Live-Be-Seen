# HALO - Go Live. Be Seen.

HALO is a social networking platform focused on live streaming with a refined, minimal aesthetic.

## Design Philosophy

- **Void Black Aesthetic**: Dark, sophisticated color palette with no neon or gaming-style elements
- **Rounded Geometry**: All UI elements use consistent, rounded corners (8-20px radius)
- **Tabular Numbers**: Consistent number spacing throughout the interface
- **Glassmorphism**: Semi-transparent surfaces with subtle borders and shadows
- **Low-Density Layout**: Generous spacing for comfortable viewing

## Architecture

### Core Components

1. **theme.ts**: Centralized design system
   - Void Black color palette
   - Spacing and typography scales
   - Border radius values
   - Shadow definitions
   - Glassmorphism settings

2. **AuthContext.tsx**: Authentication state management
   - User session handling
   - Adult Mode toggle
   - Age verification tracking

3. **filterContentForUser utility**: Content gating
   - Filters content based on Adult Mode settings
   - Age-based content restrictions
   - Safe defaults for unauthenticated users

### Screens

1. **LoginScreen**: Glassmorphism-based authentication
   - Semi-transparent card with backdrop blur
   - Clean, minimal input fields
   - No urgency-based copy

2. **DiscoveryFeed**: Low-density content feed
   - Generous spacing between items (24px)
   - Clear visual hierarchy
   - Viewer counts with tabular numbers

3. **LiveStreamOverlay**: Stream viewing interface
   - One-tap reporting functionality
   - Minimalist control layout
   - Clean confirmation feedback

## Features

### Adult Mode Gating
Content is automatically filtered based on:
- User authentication status
- Adult Mode preference
- Age verification (18+ requirement)

### One-Tap Reporting
- Simple, immediate reporting action
- Clean confirmation feedback
- No multi-step confirmation flows

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Expo CLI

### Installation

```bash
npm install
```

### Running the App

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## Project Structure

```
/
├── src/
│   ├── components/
│   │   └── LiveStreamOverlay.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   └── DiscoveryFeed.tsx
│   ├── utils/
│   │   └── filterContentForUser.ts
│   └── theme.ts
├── App.tsx
├── index.js
├── package.json
└── tsconfig.json
```

## Design Specifications

### Colors
- Void Black: `#000000`
- Deep Gray: `#121212`
- Dark Gray: `#1a1a1a`
- Text Primary: `#ffffff`
- Text Secondary: `#b0b0b0`

### Typography
- All numbers use `tabular-nums` variant
- Font sizes: 12-32px scale
- Line heights: 1.2-1.75

### Spacing
- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 32px
- XXL: 48px

### Border Radius
- Small: 8px
- Medium: 12px
- Large: 16px
- Extra Large: 20px
- Round: 9999px

## License

MIT 
