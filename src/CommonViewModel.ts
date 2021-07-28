import {ColorSchemeName} from 'react-native'
import {COLORS, COLORS_NIGHT} from "./common/Constants"

export declare type BackgroundStyle = {
  backgroundColor: COLORS | COLORS_NIGHT
  flex: number
  paddingBottom?: number
  paddingStart?: number
  paddingEnd?: number
}

export default class {
  isDarkMode: boolean
  iconSufix: ColorSchemeName = "light"
  appBackgroundStyle: BackgroundStyle
  backgroundStyle: BackgroundStyle

  constructor(colorScheme: ColorSchemeName) {
    this.isDarkMode = colorScheme === 'dark'
    this.iconSufix = colorScheme
    this.appBackgroundStyle = (() => {
      const THEME = this.isDarkMode ? COLORS_NIGHT : COLORS
      return {
        backgroundColor: THEME.bg,
        flex: 1,
      }
    })()
    this.backgroundStyle = (() => {
      const THEME = this.isDarkMode ? COLORS_NIGHT : COLORS
      return {
        backgroundColor: THEME.bg,
        flex: 1,
        paddingBottom: 16,
        paddingStart: 16,
        paddingEnd: 16,
      }
    })()
  }

}
