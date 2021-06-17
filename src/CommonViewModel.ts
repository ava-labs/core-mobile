import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {StatusBar} from 'react-native';
import {COLORS, COLORS_NIGHT} from "./common/Constants"

export default class {
  constructor(colorScheme: string) {
    this.isDarkMode.next(colorScheme === 'dark');
  }

  isDarkMode: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  backgroundStyle: Observable<object> = this.isDarkMode.pipe(
    map(isDarkMode => {
      const THEME = isDarkMode ? COLORS_NIGHT : COLORS
      return {
        backgroundColor: THEME.bg,
        flex: 1,
        paddingTop: StatusBar.currentHeight,
        paddingBottom: 18,
        paddingStart: 18,
        paddingEnd: 18,
      };
    }),
  );
}
