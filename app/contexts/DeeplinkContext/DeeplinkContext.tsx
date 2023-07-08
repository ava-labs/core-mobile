import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectWalletState, WalletState } from 'store/app'
import { noop } from '@avalabs/utils-sdk'
import { Linking } from 'react-native'
import { newSession as newSessionV1 } from 'store/walletConnect'
import {
  newSession as newSessionV2,
  WalletConnectVersions
} from 'store/walletConnectV2'
import { selectActiveNetwork } from 'store/network'
import Logger from 'utils/Logger'
import { parseWalletConnetLink } from './utils'
import { DeepLink, DeeplinkContextType, DeepLinkOrigin } from './types'

const DeeplinkContext = createContext<DeeplinkContextType>({
  pendingDeepLink: undefined,
  setPendingDeepLink: noop
})

export const DeeplinkContextProvider = ({
  children
}: {
  children: React.ReactNode
}) => {
  const dispatch = useDispatch()
  const activeNetwork = useSelector(selectActiveNetwork)
  const walletState = useSelector(selectWalletState)
  const isWalletActive = walletState === WalletState.ACTIVE

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

  /******************************************************************************
   * Process deep link if there is one pending and app is unlocked
   *****************************************************************************/
  useEffect(() => {
    if (pendingDeepLink && isWalletActive) {
      const result = parseWalletConnetLink(pendingDeepLink.url)

      if (result) {
        // link is a valid wallet connect uri
        const { version, uri } = result
        const versionStr = version.toString()

        if (versionStr === WalletConnectVersions.V1) {
          dispatch(newSessionV1(uri))
        } else if (versionStr === WalletConnectVersions.V2) {
          dispatch(newSessionV2(uri))
        }

        // once we used the url, we can expire it
        expireDeepLink()
      } else {
        Logger.info(`${pendingDeepLink.url} is not a wallet connect link`)
      }
    }
  }, [isWalletActive, pendingDeepLink, activeNetwork, expireDeepLink, dispatch])

  return (
    <DeeplinkContext.Provider
      value={{
        pendingDeepLink,
        setPendingDeepLink
      }}>
      {children}
    </DeeplinkContext.Provider>
  )
}

export const useDeeplink = () => useContext(DeeplinkContext)
