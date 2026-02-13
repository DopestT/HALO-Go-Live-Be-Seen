# Repository Migration Note

## New Structure (February 2026)

The repository has been reorganized into a cleaner structure:

```
HALO/
├── frontend/     # React Native app (PRIMARY - use this)
├── backend/      # Go API Gateway
└── docs/         # App Store materials
```

## Legacy Directories

The following directories are from the previous structure and may be deprecated:

- **Root-level app files** (App.tsx, src/, package.json, etc.) - Earlier implementation
- **halo-app/** - Previous frontend directory (content copied to frontend/)

### What to Use

**For frontend development**, use the `frontend/` directory. It contains the complete, most up-to-date React Native application with:
- Full navigation stack
- Complete context providers (Auth, Stream)
- All screen components
- Proper component library (GlassPanel, HaloButton, etc.)
- Safety utilities

**For backend development**, use the `backend/` directory (Go API Gateway).

**For App Store submissions**, use the `docs/` directory.

## Migration Path

If you're working on code in the old locations:
1. Move your work to the corresponding location in `frontend/`
2. Update imports and paths as needed
3. Test thoroughly in the new structure

The legacy directories may be removed in a future cleanup once all development has transitioned to the new structure.
