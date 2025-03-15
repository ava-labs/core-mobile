import { SxProp } from 'dripsy'
import { text, TextVariant } from '../theme/tokens/text'

export const getLineHeightFromVariant = (
  variant?: TextVariant
): number | undefined => {
  return variant && text[variant].lineHeight
}

export const getLineHeightFromSxProps = (sx?: SxProp): number | undefined => {
  return sx && 'lineHeight' in sx ? (sx.lineHeight as number) : undefined
}

export const getLineHeight = (
  variant?: TextVariant,
  sx?: SxProp
): number | undefined => {
  return sx
    ? getLineHeightFromSxProps(sx)
    : variant
    ? getLineHeightFromVariant(variant)
    : undefined
}
