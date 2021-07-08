import {BehaviorSubject, Observable} from 'rxjs'
import {map} from 'rxjs/operators'
import {ColorSchemeName} from 'react-native'
import {COLORS, COLORS_NIGHT} from "./common/Constants"

export default class {
  constructor(colorScheme: ColorSchemeName) {
    this.isDarkMode.next(colorScheme === 'dark')
    this.iconSufix.next(colorScheme)
  }

  isDarkMode: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  iconSufix: BehaviorSubject<ColorSchemeName> = new BehaviorSubject<ColorSchemeName>("light")
  appBackgroundStyle: Observable<object> = this.isDarkMode.pipe(
    map(isDarkMode => {
      const THEME = isDarkMode ? COLORS_NIGHT : COLORS
      return {
        backgroundColor: THEME.bg,
        flex: 1,
      }
    }),
  )
  backgroundStyle: Observable<object> = this.isDarkMode.pipe(
    map(isDarkMode => {
      const THEME = isDarkMode ? COLORS_NIGHT : COLORS
      return {
        backgroundColor: THEME.bg,
        flex: 1,
        paddingBottom: 16,
        paddingStart: 16,
        paddingEnd: 16,
      }
    }),
  )
}
