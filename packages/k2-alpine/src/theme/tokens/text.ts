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
