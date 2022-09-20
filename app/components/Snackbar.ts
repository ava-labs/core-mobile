import { ToastOptions } from 'react-native-toast-notifications/lib/typescript/toast'

const LENGTH_SHORT = 3000
const LENGTH_LONG = 5000
const LENGTH_INFINITE = Number.MAX_SAFE_INTEGER

// provided by `global`. See ContextApp.tsx and index.d.ts at the root of the project.
export function ShowSnackBar(text: string, long = false) {
  return global?.toast?.show(text, {
    type: 'normal',
    placement: 'top',
    duration: long ? LENGTH_LONG : LENGTH_SHORT,
    animationType: 'slide-in',
    style: { backgroundColor: '#2A2A2D' }
  })
}

type showCustomProps = {
  component: JSX.Element
  duration: 'short' | 'long' | 'infinite'
  placement?: 'top' | 'bottom'
  id?: string
}

export function showSnackBarCustom({
  component,
  duration,
  placement = 'top',
  id
}: showCustomProps) {
  const toastOptions = {
    type: 'transaction',
    placement: placement,
    animationType: 'slide-in',
    style: {
      paddingHorizontal: 0
    },
    duration:
      duration === 'infinite'
        ? LENGTH_INFINITE
        : duration === 'long'
        ? LENGTH_LONG
        : LENGTH_SHORT
  } as ToastOptions
  if (id) {
    // there's bug in react-native-toast-notifications which overwrites id if you pass id: undefined
    toastOptions.id = id
  }
  return global?.toast?.show(component, toastOptions)
}

export function updateSnackBarCustom(
  id: string,
  component: JSX.Element,
  long = true
) {
  global?.toast?.update(id, component, {
    duration: long ? LENGTH_LONG : LENGTH_SHORT
  })
}
