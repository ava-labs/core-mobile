import tinycolor from 'tinycolor2'

export function alpha(color: string, value: number): string {
  return tinycolor(color).setAlpha(value).toString()
}
