export enum Appearance {
  Dark = 'Dark theme',
  Light = 'Light theme',
  System = 'System'
}

export type ColorSchemeName = 'light' | 'dark'

export const DEFAULT_APPEARANCE = Appearance.System

/*
  selected: 'Dark theme' | 'Light theme' | 'System'
  - this is the appearance that the user has selected in the settings
  colorScheme: 'light' | 'dark'
  - this is the color scheme that is currently being used by the app
*/
export const initialState: AppearanceState = {
  selected: DEFAULT_APPEARANCE,
  colorScheme: 'light'
}

export type AppearanceState = {
  selected: Appearance
  colorScheme: 'light' | 'dark'
}
