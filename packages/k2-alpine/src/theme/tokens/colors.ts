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

  // brand
  // Default behavior matches the legacy inverse-surface pattern used by the
  // primary button: dark fill in light mode, light fill in dark mode.
  $primary: colors.$neutral850,
  $onPrimary: colors.$neutralWhite,
  $accent: colors.$accentTeal,

  // inverse — surfaces that intentionally contrast their surroundings
  // (snackbars, toasts, etc.). Same shape across themes; values flip per
  // theme so consumers don't need to know about light/dark themselves.
  $inverseSurface: colors.$neutral850,
  $inverseOnSurface: colors.$neutralWhite,

  // border
  $borderPrimary: alpha(colors.$neutralBlack, 0.1)
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

  // brand
  $primary: colors.$neutralWhite,
  $onPrimary: colors.$neutral850,
  $accent: colors.$accentTeal,

  // inverse
  $inverseSurface: colors.$neutralWhite,
  $inverseOnSurface: colors.$neutral850,

  // border
  $borderPrimary: alpha(colors.$neutralWhite, 0.1)
}

// Motorola "Hello UI" v1.0 tokens — maps the Hello design system role values
// onto the existing k2-alpine role names so every consumer keeps working.
// Vellum neutrals + Whale primary + Coral accent as documented in the
// Hello design guidelines.
const moto = {
  // Vellum neutrals
  vellum4: '#070E18',
  vellum10: '#161C27',
  vellum12: '#1B2029',
  vellum17: '#262A32',
  vellum30: '#454649',
  vellum87: '#DED9D4',
  vellum94: '#F1EEEB',
  vellum96: '#F5F3F1',
  vellum98: '#FBF9F7',
  // Whale (primary brand blue)
  whale20: '#003060',
  whale50: '#0D77DA',
  whale80: '#A6C8FF',
  // Coral (signature accent — links / brand highlights)
  coral60: '#FB575F',
  coral70: '#FF8889',
  // Errors / success
  errorLight: '#D83D48',
  errorDark: '#FFB3B1',
  successLight: '#1F7A37',
  successDark: '#9BF6AE'
}

export const motoLightModeColors = {
  $white: colors.$neutralWhite,
  $black: colors.$neutralBlack,

  $textPrimary: moto.vellum10,
  $textSecondary: moto.vellum30,
  $textDanger: moto.errorLight,
  $textSuccess: moto.successLight,

  $surfacePrimary: moto.vellum98,
  $surfaceSecondary: moto.vellum96,
  $surfaceTertiary: moto.vellum94,

  // Primary = Whale 50 (Hello UI's stock factory theme primary). White text
  // on dark blue meets Hello UI's contrast guidance: "use white text on
  // shades 50 or darker."
  $primary: moto.whale50,
  $onPrimary: colors.$neutralWhite,
  $accent: moto.coral60,

  $inverseSurface: moto.vellum10,
  $inverseOnSurface: moto.vellum94,

  $borderPrimary: moto.vellum87
}

export const motoDarkModeColors = {
  $white: colors.$neutralWhite,
  $black: colors.$neutralBlack,

  $textPrimary: moto.vellum94,
  $textSecondary: moto.vellum87,
  $textDanger: moto.errorDark,
  $textSuccess: moto.successDark,

  $surfacePrimary: moto.vellum4,
  $surfaceSecondary: moto.vellum12,
  $surfaceTertiary: moto.vellum17,

  // Dark Moto: primary lightens to Whale 80 with dark Whale 20 text per
  // Hello UI dark-theme rules ("primary lightens; on-primary darkens").
  // Whale 80 is light enough for "use dark text on shades 60 or lighter."
  $primary: moto.whale80,
  $onPrimary: moto.whale20,
  $accent: moto.coral70,

  $inverseSurface: moto.vellum94,
  $inverseOnSurface: moto.vellum10,

  $borderPrimary: moto.vellum30
}

// Motorola "hello moto" brand gradient — pink → coral, ~135° (top-left to
// bottom-right). Use for hero spots: signup splash, primary CTAs, balance
// card. Apply via `expo-linear-gradient` for surfaces and MaskedView +
// LinearGradient for text fills.
export const motoBrandGradient = {
  colors: ['#F0568A', '#FB8B5C'] as [string, string],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 }
}
