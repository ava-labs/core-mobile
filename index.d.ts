import { RootScreenStackParamList } from './app/navigation/RootScreenStack'
/**
 * Necessary type file for react-native-toast-notification so it's inserted in the global context.
 * Documentation: https://github.com/arnnis/react-native-toast-notifications#--how-to-call-toast-outside-react-components
 */
export {}

type ToastType = import('react-native-toast-notifications').ToastType

declare global {
  // eslint-disable-next-line no-var
  var toast: ToastType

  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface RootParamList extends RootScreenStackParamList {}
  }
}
