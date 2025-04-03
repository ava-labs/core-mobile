export enum Appearance {
  Dark = 'Dark theme',
  Light = 'Light theme',
  System = 'System'
}

export type ColorSchemeName = 'light' | 'dark'

export const DEFAULT_APPEARANCE = Appearance.System

export const initialState: AppearanceState = {
  selected: DEFAULT_APPEARANCE,
  colorScheme: 'light'
}

export type AppearanceState = {
  selected: Appearance
  colorScheme: 'light' | 'dark'
}
