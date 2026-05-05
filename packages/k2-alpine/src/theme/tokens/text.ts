// K2 Alpine - Typography
// https://www.figma.com/design/opZ4C1UGzcoGRjxE4ZIE3J/K2-Alpine?node-id=14-4148&node-type=canvas&t=n6EXyTJUG0nuv3Fv-0

export const text = {
  heading1: {
    fontFamily: 'Aeonik-Medium',
    fontSize: 60,
    lineHeight: 60
  },
  heading2: {
    fontFamily: 'Aeonik-Bold',
    fontSize: 36,
    lineHeight: 36
  },
  heading3: {
    fontFamily: 'Aeonik-Bold',
    fontSize: 27,
    lineHeight: 27
  },
  heading4: {
    fontFamily: 'Aeonik-Bold',
    fontSize: 24,
    lineHeight: 27,
    letterSpacing: -0.5
  },
  heading5: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 21,
    lineHeight: 21
  },
  heading6: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    lineHeight: 21
  },
  subtitle1: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 20
  },
  subtitle2: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 16
  },
  body1: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 18
  },
  body2: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 17
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 14
  },
  mono: {
    fontFamily: 'DejaVuSansMono',
    fontSize: 12,
    lineHeight: 16
  },
  buttonLarge: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    lineHeight: 18
  },
  buttonMedium: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    lineHeight: 18
  },
  buttonSmall: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 14
  },
  priceChangeIndicatorLarge: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    lineHeight: 24
  }
}

export type TextVariant = keyof typeof text

// Hello UI typography mapped onto the existing k2-alpine variant names so
// switching themes flips the whole type scale without touching call sites.
// Now using Motorola Rookery (the partner-licensed brand typeface);
// Rookery's Medium/Regular/Bold weights cover the Hello UI scale. Body
// text falls back to Inter via React Native's font fallback if Rookery
// is unavailable.
export const motoText = {
  heading1: {
    fontFamily: 'Rookery-Bold',
    fontSize: 57,
    lineHeight: 64,
    letterSpacing: -0.6
  },
  heading2: {
    fontFamily: 'Rookery-Bold',
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.4
  },
  heading3: {
    fontFamily: 'Rookery-Bold',
    fontSize: 28,
    lineHeight: 36
  },
  heading4: {
    fontFamily: 'Rookery-Bold',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0
  },
  heading5: {
    fontFamily: 'Rookery-Medium',
    fontSize: 22,
    lineHeight: 28
  },
  heading6: {
    fontFamily: 'Rookery-Medium',
    fontSize: 16,
    lineHeight: 24
  },
  subtitle1: {
    fontFamily: 'Rookery-Regular',
    fontSize: 16,
    lineHeight: 24
  },
  subtitle2: {
    fontFamily: 'Rookery-Regular',
    fontSize: 12,
    lineHeight: 16
  },
  body1: {
    fontFamily: 'Rookery-Regular',
    fontSize: 16,
    lineHeight: 24
  },
  body2: {
    fontFamily: 'Rookery-Regular',
    fontSize: 14,
    lineHeight: 20
  },
  caption: {
    fontFamily: 'Rookery-Regular',
    fontSize: 12,
    lineHeight: 16
  },
  mono: {
    fontFamily: 'DejaVuSansMono',
    fontSize: 12,
    lineHeight: 16
  },
  buttonLarge: {
    fontFamily: 'Rookery-Bold',
    fontSize: 14,
    lineHeight: 20
  },
  buttonMedium: {
    fontFamily: 'Rookery-Bold',
    fontSize: 12,
    lineHeight: 16
  },
  buttonSmall: {
    fontFamily: 'Rookery-Bold',
    fontSize: 11,
    lineHeight: 16
  },
  priceChangeIndicatorLarge: {
    fontFamily: 'Rookery-Bold',
    fontSize: 24,
    lineHeight: 32
  }
}
