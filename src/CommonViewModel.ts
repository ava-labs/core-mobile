import {Colors} from 'react-native/Libraries/NewAppScreen';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {StatusBar} from 'react-native';

export default class {
  constructor(colorScheme: string) {
    this.isDarkMode.next(colorScheme === 'dark');
  }

  isDarkMode: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  backgroundStyle: Observable<object> = this.isDarkMode.pipe(
    map(isDarkMode => {
      return {
        backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
        flex: 1,
        paddingTop: StatusBar.currentHeight,
      };
    }),
  );
}
