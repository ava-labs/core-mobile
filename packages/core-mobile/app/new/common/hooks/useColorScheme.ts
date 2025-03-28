import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Appearance, selectSelectedAppearance } from 'store/settings/appearance'
import {
  Appearance as RnAppearance,
  useColorScheme as useRnColorScheme,
  ColorSchemeName
} from 'react-native'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const useColorScheme = (): ColorSchemeName => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedAppearance = useSelector(selectSelectedAppearance)
  const colorScheme = useRnColorScheme()

  useEffect(() => {
    if (isDeveloperMode) {
      RnAppearance.setColorScheme('dark')
      return
    }
    switch (selectedAppearance) {
      case Appearance.Light:
        RnAppearance.setColorScheme('light')
        break
      case Appearance.Dark:
        RnAppearance.setColorScheme('dark')
        break
      case Appearance.System:
      default:
        // default to system appearance
        RnAppearance.setColorScheme(null)
    }
  }, [isDeveloperMode, selectedAppearance])

  return useMemo(() => {
    if (isDeveloperMode) return 'dark'
    return colorScheme
  }, [colorScheme, isDeveloperMode])
}
