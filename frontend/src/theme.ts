/**
 * DuLịch Travel — "Sea & Sky" Premium Design System v2
 *
 * Deep ocean blue primary, bright sky blue highlights,
 * sunset amber accents, warm off-white backgrounds.
 * Image-first philosophy: UI should disappear, let travel photos shine.
 */
export const theme = {
  colors: {
    // ── Primary: Ocean Blue ──
    primary: '#0369A1',       // sky-700 — main brand color
    primaryDark: '#075985',   // sky-800 — pressed/header
    primaryLight: '#38BDF8',  // sky-400 — badges, highlights
    primaryMuted: '#E0F2FE',  // sky-100 — light tinted bg
    primarySoft: '#BAE6FD',   // sky-200 — icon bg tint

    // ── Accent: Sunset Amber ──
    accent: '#F97316',        // orange-500 — CTA, prices
    accentDark: '#EA580C',    // orange-600 — pressed
    accentLight: '#FDBA74',   // orange-300 — soft accent
    accentMuted: '#FFF7ED',   // orange-50 — warm highlight bg

    // ── Surfaces ──
    background: '#F8FAFC',    // slate-50 — main app bg
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9', // slate-100 — subtle card bg
    surfaceWarm: '#FFF7ED',   // orange-50 — warm sections
    surfaceElevated: '#FFFFFF',

    // ── Typography ──
    text: '#0F172A',          // slate-900
    textSecondary: '#64748B', // slate-500
    textLight: '#94A3B8',     // slate-400
    textOnPrimary: '#FFFFFF',
    textOnDark: '#F8FAFC',

    // ── Status ──
    success: '#16A34A',
    successMuted: '#DCFCE7',
    warning: '#F59E0B',
    warningMuted: '#FEF3C7',
    error: '#DC2626',
    errorMuted: '#FEE2E2',
    info: '#0EA5E9',
    infoMuted: '#E0F2FE',

    // ── Utility ──
    border: '#E2E8F0',       // slate-200
    borderLight: '#F1F5F9',  // slate-100
    shadow: 'rgba(15,23,42,0.08)',
    shadowColored: 'rgba(3,105,161,0.12)',
    overlay: 'rgba(15,23,42,0.5)',
    overlayLight: 'rgba(15,23,42,0.3)',
    star: '#F59E0B',         // amber-500
    heart: '#EF4444',
    frosted: 'rgba(255,255,255,0.85)',

    // ── Gradient ──
    gradient: {
      start: '#075985',      // sky-800 deep ocean
      mid: '#0369A1',        // sky-700
      end: '#0EA5E9',        // sky-500 bright sky
    },
    gradientWarm: {
      start: '#F97316',      // orange-500
      end: '#FB923C',        // orange-400
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  borderRadius: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    full: 999,
  },

  shadows: {
    sm: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
    xl: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 32,
      elevation: 12,
    },
    colored: {
      shadowColor: '#0369A1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 4,
    },
  },

  typography: {
    hero: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.8, lineHeight: 36 },
    h1: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.5, lineHeight: 32 },
    h2: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 26 },
    h3: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 22 },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
    bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
    caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.2 },
    label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
    button: { fontSize: 15, fontWeight: '600' as const, letterSpacing: 0.2 },
    buttonLg: { fontSize: 16, fontWeight: '700' as const, letterSpacing: 0.3 },
    price: { fontSize: 18, fontWeight: '800' as const, letterSpacing: -0.3 },
    priceLg: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.3 },
  },

  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
    spring: { damping: 15, stiffness: 150 },
  },
};
