/**
 * App theme — design tokens for the travel app
 * 
 * Premium color palette inspired by tropical travel:
 * - Deep ocean blue primary
 * - Warm coral accent
 * - Soft neutral backgrounds
 */
export const theme = {
  colors: {
    primary: '#1B6B93',
    primaryDark: '#0F4C75',
    primaryLight: '#4FC0D0',
    accent: '#FF6B6B',
    accentLight: '#FFA07A',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceVariant: '#F0F4F8',
    text: '#1A1A2E',
    textSecondary: '#6C757D',
    textLight: '#ADB5BD',
    success: '#2ECC71',
    warning: '#F39C12',
    error: '#E74C3C',
    border: '#E9ECEF',
    shadow: 'rgba(0, 0, 0, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    gradient: {
      start: '#1B6B93',
      end: '#4FC0D0',
    },
    star: '#FFD700',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
  typography: {
    h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
    h3: { fontSize: 18, fontWeight: '600' as const },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
    bodySmall: { fontSize: 13, fontWeight: '400' as const },
    caption: { fontSize: 12, fontWeight: '500' as const },
    button: { fontSize: 16, fontWeight: '600' as const, letterSpacing: 0.5 },
  },
};
