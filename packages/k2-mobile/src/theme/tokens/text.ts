// K2 Foundation - Typography
// https://www.figma.com/file/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?type=design&node-id=3390-22100

export const text = {
  heading1: {
    fontFamily: 'Inter-Regular',
    fontSize: 60,
    lineHeight: 72
  },
  heading2: {
    fontFamily: 'Inter-Regular',
    fontSize: 48,
    lineHeight: 56
  },
  heading3: {
    fontFamily: 'Inter-Bold',
    fontSize: 34,
    lineHeight: 44
  },
  heading4: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    lineHeight: 32
  },
  heading5: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    lineHeight: 32
  },
  heading6: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    lineHeight: 24
  },
  subtitle1: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 28
  },
  subtitle2: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 25
  },
  body1: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24
  },
  body2: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20
  },
  body3: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 15
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 20
  },
  overline: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    lineHeight: 16
  },

  // component styles
  alertTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 16
  },
  alertDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 20
  },
  badgeLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 20
  },
  buttonLarge: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    lineHeight: 24
  },
  buttonMedium: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 16
  },
  buttonSmall: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16
  },
  inputLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 16
  },
  helperText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 20
  },
  inputText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24
  },
  chipLabelLarge: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20
  },
  chipLabelSmall: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 20
  },
  tooltipLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16
  },
  tableHeader: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20
  },
  menuItem: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20
  },
  listSubHeader: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 48
  },
  bottomNavigationLarge: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16
  },
  bottomNavigationSmall: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    lineHeight: 16
  }
}

export type TextVariant = keyof typeof text
