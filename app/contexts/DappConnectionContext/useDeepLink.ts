import { useEffect, useCallback, useState } from 'react'
import { Linking } from 'react-native'
import { DeepLink, DeepLinkOrigin } from 'services/walletconnect/types'

export const useDeepLink = () => {
  const [pendingDeepLink, setPendingDeepLink] = useState<DeepLink>()

  const expireDeepLink = useCallback(() => {
    setPendingDeepLink(undefined)
  }, [])

  /******************************************************************************
   * Start listeners that will receive the deep link url
   *****************************************************************************/
  useEffect(() => {
    // triggered if app is running
    const listener = Linking.addEventListener('url', ({ url }) => {
      setPendingDeepLink({ url, origin: DeepLinkOrigin.ORIGIN_DEEPLINK })
    })

    async function checkInitialUrl() {
      // initial URL (when app comes from cold start)
      const url = await Linking.getInitialURL()
      if (url) {
        setPendingDeepLink({ url, origin: DeepLinkOrigin.ORIGIN_DEEPLINK })
      }
    }

    checkInitialUrl()

    return () => {
      listener.remove()
    }
  }, [])

  return {
    pendingDeepLink,
    setPendingDeepLink,
    expireDeepLink
  }
}
