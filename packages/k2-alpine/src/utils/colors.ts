import tinycolor from 'tinycolor2'

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
