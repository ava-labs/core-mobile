import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { selectWalletState, WalletState } from 'store/app'
import { noop } from '@avalabs/core-utils-sdk'
import { Linking } from 'react-native'
import NotificationsService from 'services/notifications/NotificationsService'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { selectAccountByAddress, setActiveAccountIndex } from 'store/account'
import Logger from 'utils/Logger'
import { selectFeatureFlags, selectIsNotificationBlocked } from 'store/posthog'
import { selectNetwork, setActive } from 'store/network'
import { FIDO_CALLBACK_URL } from 'services/passkey/consts'
import { RootState } from 'store'
import { handleDeeplink } from './utils/handleDeeplink'
import {
  DeepLink,
  DeeplinkContextType,
  DeepLinkOrigin,
  HandleNotificationCallback
} from './types'

const DeeplinkContext = createContext<DeeplinkContextType>({
  pendingDeepLink: undefined,
  setPendingDeepLink: noop
})

export const DeeplinkContextProvider = ({
  children
}: {
  children: React.ReactNode
}): JSX.Element => {
  const dispatch = useDispatch()
  const store = useStore()
  const walletState = useSelector(selectWalletState)
  const isWalletActive = walletState === WalletState.ACTIVE
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isNotificationBlocked = useSelector(selectIsNotificationBlocked)
  const processedFeatureFlags = useSelector(selectFeatureFlags)
  const [pendingDeepLink, setPendingDeepLink] = useState<DeepLink>()

  const maybeSetActiveNetwork = useCallback(
    (data: { [p: string]: string | number | object }) => {
      if (
        'chainId' in data &&
        ['string' || 'number'].includes(typeof data.chainId)
      ) {
        const chainId = Number(data.chainId)
        const network = selectNetwork(chainId)(store.getState() as RootState)
        //check if testnet should be toggled to match chainId provided in data
        if (network && network.isTestnet !== isDeveloperMode) {
          dispatch(toggleDeveloperMode())
        }
        dispatch(setActive(chainId))
      }
    },
    [dispatch, isDeveloperMode, store]
  )

  const maybeSetActiveAccount = useCallback(
    (data: { [p: string]: string | number | object }) => {
      if ('accountAddress' in data && typeof data.accountAddress === 'string') {
        const account = selectAccountByAddress(data.accountAddress)(
          store.getState() as RootState
        )
        if (account) {
          dispatch(setActiveAccountIndex(account.index))
        }
      }
      if ('accountIndex' in data && typeof data.accountIndex === 'number') {
        dispatch(setActiveAccountIndex(data.accountIndex))
      }
    },
    [dispatch, store]
  )

  const handleNotificationCallback: HandleNotificationCallback = useCallback(
    (data: { [p: string]: string | number | object } | undefined) => {
      if (!data) {
        Logger.error(
          `[packages/core-mobile/app/contexts/DeeplinkContext/DeeplinkContext.tsx][handleNotificationCallback] no data`
        )
        return
      }
      if (!data.url) {
        Logger.error(
          `[packages/core-mobile/app/contexts/DeeplinkContext/DeeplinkContext.tsx][handleNotificationCallback] no url`
        )
        return
      }
      const runCallback = (): void => {
        maybeSetActiveNetwork(data)
        maybeSetActiveAccount(data)
      }
      setPendingDeepLink({
        url: data.url as string,
        origin: DeepLinkOrigin.ORIGIN_NOTIFICATION,
        callback: runCallback
      })
    },
    [maybeSetActiveAccount, maybeSetActiveNetwork]
  )

  /******************************************************************************
   * Start listeners that will receive the deep link url
   *****************************************************************************/
  useEffect(() => {
    if (isNotificationBlocked) return
    NotificationsService.getInitialNotification(
      handleNotificationCallback
    ).catch(reason => {
      Logger.error(
        `[packages/core-mobile/app/contexts/DeeplinkContext/DeeplinkContext.tsx][getInitialNotification]${reason}`
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNotificationBlocked])

  useEffect(() => {
    if (isNotificationBlocked) return

    const unsubscribeForegroundEvent = NotificationsService.onForegroundEvent(
      handleNotificationCallback
    )

    NotificationsService.onBackgroundEvent(handleNotificationCallback)

    return () => {
      unsubscribeForegroundEvent()
    }
  }, [handleNotificationCallback, isNotificationBlocked])

  useEffect(() => {
    // triggered if app is running
    const listener = Linking.addEventListener('url', ({ url }) => {
      if (url.startsWith(FIDO_CALLBACK_URL)) {
        // no need to handle fido callback url since that is already handled by the passkey service
        return
      }

      setPendingDeepLink({
        url,
        origin: DeepLinkOrigin.ORIGIN_DEEPLINK
      })
    })

    async function checkInitialUrl(): Promise<void> {
      // initial URL (when app comes from cold start)
      const url = await Linking.getInitialURL()

      if (url) {
        setPendingDeepLink({
          url,
          origin: DeepLinkOrigin.ORIGIN_DEEPLINK
        })
      }
    }

    checkInitialUrl().catch(reason => {
      Logger.error(
        `[packages/core-mobile/app/contexts/DeeplinkContext/DeeplinkContext.tsx][checkInitialUrl]${reason}`
      )
    })

    return () => {
      listener.remove()
    }
  }, [])

  /******************************************************************************
   * Process deep link if there is one pending and app is unlocked
   *****************************************************************************/
  useEffect(() => {
    if (pendingDeepLink && isWalletActive) {
      handleDeeplink(pendingDeepLink, dispatch, processedFeatureFlags)
      // once we used the url, we can expire it
      setPendingDeepLink(undefined)
    }
  }, [isWalletActive, pendingDeepLink, dispatch, processedFeatureFlags])

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

export const useDeeplink = (): DeeplinkContextType =>
  useContext(DeeplinkContext)
