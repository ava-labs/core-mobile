import { useTheme } from '@avalabs/k2-mobile'

export const useSkeletonColors = (): {
  backgroundColor: string
  foregroundColor: string
} => {
  const {
    theme: { colors }
  } = useTheme()
  const backgroundColor = colors.$neutral900
  const foregroundColor = colors.$neutral850

  return { backgroundColor, foregroundColor }
}
