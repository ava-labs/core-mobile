// K2 Alpine - Colors
// https://www.figma.com/design/opZ4C1UGzcoGRjxE4ZIE3J/K2-Alpine?node-id=781-3507&node-type=frame&t=J5mVaf37BsbqucdK-0

import { alpha } from '../../utils'

// notes: raw colors should never be used directly
export const colors = {
  // neutral
  $neutralWhite: '#FFFFFF',
  $neutral50: '#F5F5F6',
  $neutral700: '#58585B',
  $neutral800: '#3E3E43',
  $neutral850: '#28282E',
  $neutral900: '#1B1B1D',
  $neutral950: '#121213',
  $neutralBlack: '#000000',

  // accent
  $accentSuccessL: '#1FA95E',
  $accentSuccessD: '#1CC51D',
  $accentDanger: '#E84142',
  $accentRed: '#FF2A6D',
  $accentTeal: '#47C4AF'
}

export const lightModeColors = {
  $white: colors.$neutralWhite,
  $black: colors.$neutralBlack,

  // text
  $textPrimary: colors.$neutral850,
  $textSecondary: alpha(colors.$neutral850, 0.6),
  $textDanger: colors.$accentDanger,
  $textSuccess: colors.$accentSuccessL,

  // surface
  $surfacePrimary: colors.$neutralWhite,
  $surfaceSecondary: colors.$neutral50,
  $surfaceTertiary: alpha(colors.$neutralWhite, 0.6),

  // border
  $borderPrimary: alpha(colors.$neutral850, 0.1)
}

export const darkModeColors = {
  $white: colors.$neutralWhite,
  $black: colors.$neutralBlack,

  // text
  $textPrimary: colors.$neutralWhite,
  $textSecondary: alpha(colors.$neutralWhite, 0.6),
  $textDanger: colors.$accentDanger,
  $textSuccess: colors.$accentSuccessD,

  // surface
  $surfacePrimary: colors.$neutral850,
  $surfaceSecondary: colors.$neutral800,
  $surfaceTertiary: colors.$neutral900,

  // border
  $borderPrimary: alpha(colors.$neutralWhite, 0.1)
}
