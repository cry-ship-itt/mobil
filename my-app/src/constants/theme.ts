export const colors = {
  background: '#0F172A',
  surface: '#1E293B',
  card: '#1E293B',
  primary: '#3B82F6',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  textSecondary: '#94A3B8',
  border: '#334155',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
};

export const Colors = {
  light: {
    background: colors.background,
    backgroundElement: colors.surface,
    backgroundSelected: colors.primary,
    text: colors.text,
    textSecondary: colors.textSecondary,
  },
  dark: {
    background: colors.background,
    backgroundElement: colors.surface,
    backgroundSelected: colors.primary,
    text: colors.text,
    textSecondary: colors.textSecondary,
  },
};

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = {
  mono: 'monospace',
};

export const Spacing = {
  half: 2,
  one: spacing.xs,
  two: spacing.sm,
  three: 12,
  four: spacing.md,
  five: 20,
  six: spacing.lg,
};

export const MaxContentWidth = 680;
export const BottomTabInset = spacing.xl;