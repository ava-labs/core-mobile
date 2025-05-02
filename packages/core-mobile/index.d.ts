import { ConfettiMethods } from 'react-native-fast-confetti'
import { RootScreenStackParamList } from './app/navigation/RootScreenStack'

/**
 * Necessary type file for react-native-toast-notification so it's inserted in the global context.
 * Documentation: https://github.com/arnnis/react-native-toast-notifications#--how-to-call-toast-outside-react-components
 */
type ToastType = import('react-native-toast-notifications').ToastType

declare global {
  // eslint-disable-next-line no-var
  var toast: ToastType
  // eslint-disable-next-line no-var
  var confetti: ConfettiMethods
  const navigator: Navigator

  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface RootParamList extends RootScreenStackParamList {}
  }
}
