import { Platform } from 'react-native'
import { useMemo } from 'react'
import { useTheme } from '../hooks/useTheme'

// to cancel out the blur effect on the backgroundColor, we need to use a darker background color for the blur view
export const useBlurBackgroundColor = (
  backgroundColor: string | undefined
): string => {
  const { theme } = useTheme()

  return useMemo(() => {
    const surfacePrimaryBlurBgMap = theme.isDark
      ? {
          [theme.colors.$surfacePrimary]:
            Platform.OS === 'ios' ? '#37373f' : '#373743',
          [theme.colors.$surfaceSecondary]:
            Platform.OS === 'ios' ? '#37373f' : '#373743',
          [theme.colors.$surfaceTertiary]:
            Platform.OS === 'ios' ? '#1A1A1C' : '#1C1C1F'
        }
      : {
          [theme.colors.$surfacePrimary]: undefined,
          [theme.colors.$surfaceSecondary]: undefined,
          [theme.colors.$surfaceTertiary]:
            Platform.OS === 'ios' ? '#8b8b8c' : '#79797c'
        }

    return (
      (backgroundColor && surfacePrimaryBlurBgMap[backgroundColor]) ??
      'transparent'
    )
  }, [theme, backgroundColor])
}
