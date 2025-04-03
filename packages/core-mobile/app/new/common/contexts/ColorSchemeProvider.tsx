import React, {
  useEffect,
  useState,
  useContext,
  createContext,
  useMemo
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import {
  Appearance,
  selectSelectedAppearance,
  setSelectedAppearance
} from 'store/settings/appearance'
import { ColorSchemeName, Appearance as RnAppearance } from 'react-native'
import { noop } from '@avalabs/core-utils-sdk'

type ColorSchemeContextType = {
  colorScheme: ColorSchemeName
  toggleColorScheme: (appearance: Appearance) => void
}

const ColorSchemeContext = createContext<ColorSchemeContextType>({
  colorScheme: null,
  toggleColorScheme: noop
})

export const ColorSchemeProvider = ({
  children
}: {
  children: React.ReactNode
}): JSX.Element => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedAppearance = useSelector(selectSelectedAppearance)
  const dispatch = useDispatch()

  const [appColorScheme, setAppColorScheme] = useState(Appearance.System)
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    RnAppearance.getColorScheme()
  )

  useEffect(() => {
    if (selectedAppearance) setAppColorScheme(selectedAppearance)
  }, [selectedAppearance])

  useEffect(() => {
    const subscription = RnAppearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme)
    })
    return () => subscription.remove()
  }, [appColorScheme])

  const currentColorScheme = useMemo(() => {
    return isDeveloperMode || appColorScheme === Appearance.Dark
      ? 'dark'
      : appColorScheme === Appearance.Light
      ? 'light'
      : systemColorScheme
  }, [appColorScheme, systemColorScheme, isDeveloperMode])

  const toggleColorScheme = (appearance: Appearance): void => {
    dispatch(setSelectedAppearance(appearance))
    setAppColorScheme(appearance)
  }

  return (
    <ColorSchemeContext.Provider
      value={{
        colorScheme: currentColorScheme,
        toggleColorScheme
      }}>
      {children}
    </ColorSchemeContext.Provider>
  )
}

export const useColorScheme = (): ColorSchemeContextType =>
  useContext(ColorSchemeContext)
