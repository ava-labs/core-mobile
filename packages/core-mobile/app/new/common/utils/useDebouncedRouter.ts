import { Href, Router, useRouter } from 'expo-router'
import debounce from 'lodash.debounce'
import { useRef } from 'react'

const DEBOUNCE_DELAY = 500 // milliseconds
const DEBOUNCE_OPTIONS = { leading: true, trailing: false }

type NavigationOptions = {
  relativeToDirectory?: boolean
  withAnchor?: boolean
}

/**
 * A custom hook that provides debounced versions of the router methods.
 * This is useful to prevent multiple rapid calls to navigation methods.
 *
 * @returns {object} An object containing debounced router methods.
 */

export const useDebouncedRouter = (): Router => {
  const router = useRouter()

  const debouncedNavigate = useRef(
    debounce(
      (href: Href, options?: NavigationOptions) => {
        router.navigate(href, options)
      },
      DEBOUNCE_DELAY,
      DEBOUNCE_OPTIONS
    )
  ).current

  const debouncedPush = useRef(
    debounce(
      (href: Href, options?: NavigationOptions) => {
        router.push(href, options)
      },
      DEBOUNCE_DELAY,
      DEBOUNCE_OPTIONS
    )
  ).current

  const debouncedReplace = useRef(
    debounce(
      (href: Href, options?: NavigationOptions) => {
        router.replace(href, options)
      },
      DEBOUNCE_DELAY,
      DEBOUNCE_OPTIONS
    )
  ).current

  const debouncedBack = useRef(
    debounce(
      () => {
        router.back()
      },
      DEBOUNCE_DELAY,
      DEBOUNCE_OPTIONS
    )
  ).current

  const debouncedDismiss = useRef(
    debounce(
      () => {
        router.dismiss()
      },
      DEBOUNCE_DELAY,
      DEBOUNCE_OPTIONS
    )
  ).current

  const debouncedDismissAll = useRef(
    debounce(
      () => {
        router.dismissAll()
      },
      DEBOUNCE_DELAY,
      DEBOUNCE_OPTIONS
    )
  ).current

  const debouncedDismissTo = useRef(
    debounce(
      (href: Href, options?: NavigationOptions) => {
        router.dismissTo(href, options)
      },
      DEBOUNCE_DELAY,
      DEBOUNCE_OPTIONS
    )
  ).current

  return {
    navigate: debouncedNavigate,
    push: debouncedPush,
    replace: debouncedReplace,
    back: debouncedBack,
    dismiss: debouncedDismiss,
    dismissAll: debouncedDismissAll,
    dismissTo: debouncedDismissTo,
    canGoBack: router.canGoBack,
    canDismiss: router.canDismiss,
    setParams: router.setParams,
    reload: router.reload
  }
}
