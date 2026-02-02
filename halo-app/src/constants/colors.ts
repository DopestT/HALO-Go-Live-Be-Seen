/**
 * HALO Color Constants
 * Dark-first palette with Void Black and soft accents
 */

export const COLORS = {
  // Primary Palette
  voidBlack: '#020617',
  deepSpace: '#0f172a',
  midnight: '#1e293b',
  slate: '#334155',
  
  // Soft Accents (No neon colors)
  softWhite: '#f8fafc',
  ghost: '#e2e8f0',
  whisper: '#cbd5e1',
  
  // Guardian Glow
  haloGlow: '#60a5fa',
  calmBlue: '#3b82f6',
  trustBlue: '#2563eb',
  
  // Status (Calm, not urgent)
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  
  // Adult Mode
  adult18Plus: '#ef4444',
  
  // Transparent Overlays
  overlay: {
    light: 'rgba(255, 255, 255, 0.05)',
    medium: 'rgba(255, 255, 255, 0.1)',
    dark: 'rgba(0, 0, 0, 0.5)',
  },
} as const;

export default COLORS;
