import tinycolor from 'tinycolor2'
import { ButtonType } from '../components'
import { K2AlpineTheme } from '../theme/theme'
import { colors, darkModeColors, lightModeColors } from '../theme/tokens/colors'

export function alpha(color: string, value: number): string {
  return tinycolor(color).setAlpha(value).toString()
}

export function overlayColor(colorA: string, colorB: string): string {
  const _colorA = tinycolor(colorA).toRgb()
  const _colorB = tinycolor(colorB).toRgb()

  const combinedAlpha = _colorA.a + _colorB.a * (1 - _colorA.a)

  const r =
    (_colorA.r * _colorA.a + _colorB.r * _colorB.a * (1 - _colorA.a)) /
    combinedAlpha
  const g =
    (_colorA.g * _colorA.a + _colorB.g * _colorB.a * (1 - _colorA.a)) /
    combinedAlpha
  const b =
    (_colorA.b * _colorA.a + _colorB.b * _colorB.a * (1 - _colorA.a)) /
    combinedAlpha

  return tinycolor({ r, g, b, a: combinedAlpha }).toRgbString()
}

export function getButtonBackgroundColor(
  type: ButtonType,
  theme: K2AlpineTheme
): string | undefined {
  if (type === 'tertiary') {
    return 'transparent'
  }

  switch (type) {
    case 'primary':
      return theme.isDark
        ? lightModeColors.$surfacePrimary
        : darkModeColors.$surfacePrimary
    case 'secondary':
      return theme.isDark
        ? alpha('#ffffff', 0.1)
        : alpha(colors.$neutral850, 0.1)
  }
}

export const getButtonTintColor = (
  type: ButtonType,
  theme: K2AlpineTheme
): string | undefined => {
  if (type === 'tertiary') {
    return theme.colors.$textPrimary
  }

  switch (type) {
    case 'primary':
      return theme.isDark
        ? lightModeColors.$textPrimary
        : darkModeColors.$textPrimary
    case 'secondary':
      return theme.colors.$textPrimary
  }
}
