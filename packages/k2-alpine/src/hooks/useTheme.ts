import { darkTheme, K2AlpineTheme, lightTheme } from '../theme/theme'

export { useDripsyTheme as useTheme } from 'dripsy'

export const useInversedTheme = ({
  isDark
}: {
  isDark: boolean
}): { theme: K2AlpineTheme } => {
  return { theme: isDark ? lightTheme : darkTheme }
}
