export enum Appearance {
  Dark = 'Dark theme',
  Light = 'Light theme',
  System = 'System'
}

export const DEFAULT_APPEARANCE = Appearance.Light

export const initialState = {
  selected: DEFAULT_APPEARANCE
}

export type AppearanceState = {
  selected: string
}
