/**
 * Necessary type file for react-native-toast-notification so it's inserted in the global context.
 * Documentation: https://github.com/arnnis/react-native-toast-notifications#--how-to-call-toast-outside-react-components
 */
export {}

type ToastType = import('react-native-toast-notifications').ToastType

declare global {
  namespace NodeJS {
    interface Global {
      toast: ToastType | null
    }
  }
}

declare const toast: ToastType
