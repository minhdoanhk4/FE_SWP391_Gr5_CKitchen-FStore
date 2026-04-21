/**
 * CKitchen Shipper — Design Tokens
 * Mirrors the web app's "Warm Earth & Forest" palette from src/styles/variables.css
 */
const T = {
  colors: {
    // Primary — Forest Green
    primary:        '#2d6a4f',
    primaryLight:   '#40916c',
    primaryLighter: '#52b788',
    primaryDark:    '#1b4332',
    primaryBg:      'rgba(45,106,79,0.10)',

    // Accent — Terracotta
    accent:      '#e76f51',
    accentLight: '#f4a261',
    accentWarm:  '#e9c46a',
    accentBg:    'rgba(231,111,81,0.10)',

    // Surfaces
    surface:       '#fefae0',
    surfaceWhite:  '#ffffff',
    surfaceHover:  '#f8f4d8',
    surfaceBorder: '#e8e0c8',

    // Text
    textDark:      '#264653',
    textMid:       '#57534e',
    textMuted:     '#78716c',
    textOnDark:    '#ffffff',

    // Semantic
    success: '#16a34a',
    warning: '#d97706',
    danger:  '#dc2626',
    info:    '#457b9d',

    // Background
    background: '#f5f0e8',
  },

  radius: {
    sm:   6,
    md:   10,
    lg:   14,
    xl:   20,
    full: 9999,
  },

  shadows: {
    card: {
      shadowColor:  '#264653',
      shadowOpacity: 0.10,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    sm: {
      shadowColor:  '#264653',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    fab: {
      shadowColor:  '#e76f51',
      shadowOpacity: 0.45,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    primaryGlow: {
      shadowColor:  '#2d6a4f',
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
  },

  // Typography scale (reference — apply via fontSize)
  fontSize: {
    xs:  11,
    sm:  13,
    md:  15,
    lg:  17,
    xl:  20,
    xxl: 24,
    h1:  28,
  },
};

export default T;
