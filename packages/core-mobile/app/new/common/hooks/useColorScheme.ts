import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Appearance, selectSelectedAppearance } from 'store/settings/appearance'
import {
  Appearance as RnAppearance,
  useColorScheme as useRnColorScheme,
  ColorSchemeName
} from 'react-native'

export const useColorScheme = (): ColorSchemeName => {
  const selectedAppearance = useSelector(selectSelectedAppearance)
  const colorScheme = useRnColorScheme()

  useEffect(() => {
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
    }
  }, [selectedAppearance])

  return colorScheme
}
