/**
 * Theme-aware glass morphism color tokens.
 * Provides consistent colors for the glassmorphic card components
 * that work on both dark and light backgrounds.
 */
export function getGlassColors(isDark: boolean) {
  // Each token is wrapped in var(--glass-*, <current literal>). With no theme
  // defining those vars the fallback reproduces today's look exactly (zero diff
  // outside Bulka); the Bulka theme (src/styles/bulka/theme.css) sets the vars to
  // opaque, slightly-darker surfaces + amber borders. These are INLINE styles, so
  // a CSS var is the only way a theme can reach them. Merge-safe & additive.
  return {
    // Card container
    cardBg: isDark
      ? 'var(--glass-card-bg, linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%))'
      : 'var(--glass-card-bg, linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%))',
    cardBorder: isDark
      ? 'var(--glass-card-border, rgba(255,255,255,0.07))'
      : 'var(--glass-card-border, rgba(0,0,0,0.1))',

    // Inner sections (cards within cards)
    innerBg: isDark
      ? 'var(--glass-inner-bg, rgba(255,255,255,0.03))'
      : 'var(--glass-inner-bg, rgba(0,0,0,0.03))',
    innerBorder: isDark
      ? 'var(--glass-inner-border, rgba(255,255,255,0.04))'
      : 'var(--glass-inner-border, rgba(0,0,0,0.06))',

    // Hover states
    hoverBg: isDark
      ? 'var(--glass-hover-bg, rgba(255,255,255,0.05))'
      : 'var(--glass-hover-bg, rgba(0,0,0,0.05))',
    hoverBorder: isDark
      ? 'var(--glass-hover-border, rgba(255,255,255,0.08))'
      : 'var(--glass-hover-border, rgba(0,0,0,0.1))',

    // Text
    text: isDark ? '#fff' : '#1a1a2e',
    textSecondary: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)',
    textMuted: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)',
    textFaint: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
    textGhost: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',

    // Progress bar track
    trackBg: isDark
      ? 'var(--glass-track-bg, rgba(255,255,255,0.06))'
      : 'var(--glass-track-bg, rgba(0,0,0,0.06))',
    trackBorder: isDark
      ? 'var(--glass-track-border, rgba(255,255,255,0.04))'
      : 'var(--glass-track-border, rgba(0,0,0,0.06))',

    // Code blocks
    codeBg: isDark
      ? 'var(--glass-code-bg, rgba(255,255,255,0.03))'
      : 'var(--glass-code-bg, rgba(0,0,0,0.04))',
    codeBorder: isDark
      ? 'var(--glass-code-border, rgba(255,255,255,0.04))'
      : 'var(--glass-code-border, rgba(0,0,0,0.06))',

    // Glow effects — reduced in light mode
    glowAlpha: isDark ? '15' : '08',

    // Shadows for light mode depth
    shadow: isDark ? 'none' : '0 2px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)',
  };
}
