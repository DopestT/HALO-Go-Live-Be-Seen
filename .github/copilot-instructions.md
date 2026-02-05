# HALO Copilot Instructions

When generating code for HALO, follow these strict rules:
1. **Styling:** Use `src/constants/theme.ts`. Never use hard borders or neon colors. Only use rounded geometry (radius: 24).
2. **Components:** Use the `GlassPanel` component for all UI containers to maintain the glassmorphism aesthetic.
3. **Safety:** Every new stream-related feature must include a reference to the `Report` and `Block` utility.
4. **Copy:** Avoid urgent or shame-based language. Use calm, respectful, and authoritative phrasing.
5. **Adult Mode:** Any logic fetching a "feed" must utilize the `filterContentForUser` utility to ensure 18+ content is gated.
