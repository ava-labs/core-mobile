import { ColorSchemeName } from 'react-native'

export enum Appearance {
  Dark = 'Dark theme',
  Light = 'Light theme',
  System = 'System'
}

export const DEFAULT_APPEARANCE = Appearance.System

export const initialState: AppearanceState = {
  selected: DEFAULT_APPEARANCE,
  colorScheme: null
}

export type AppearanceState = {
  selected: Appearance
  colorScheme: ColorSchemeName
}
