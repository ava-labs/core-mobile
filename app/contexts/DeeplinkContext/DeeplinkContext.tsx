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
import NotificationsService from 'services/notifications/NotificationsService'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { setActiveAccountIndex } from 'store/account'
import { handleDeeplink } from './utils/handleDeeplink'
import {
  DeepLink,
  DeeplinkContextType,
  DeepLinkOrigin,
  NotificationCallbackProps
} from './types'

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
  const walletState = useSelector(selectWalletState)
  const isWalletActive = walletState === WalletState.ACTIVE
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const [pendingDeepLink, setPendingDeepLink] = useState<DeepLink>()

  const expireDeepLink = useCallback(() => {
    setPendingDeepLink(undefined)
  }, [])

  const handleNotificationCallback = useCallback(
    ({ url, accountIndex, origin, isDevMode }: NotificationCallbackProps) => {
      const runCallback = () => {
        isDevMode !== isDeveloperMode && dispatch(toggleDeveloperMode())
        dispatch(setActiveAccountIndex(accountIndex))
      }
      setPendingDeepLink({ url, origin, callback: runCallback })
    },
    [dispatch, isDeveloperMode]
  )

  /******************************************************************************
   * Start listeners that will receive the deep link url
   *****************************************************************************/
  useEffect(() => {
    NotificationsService.getInitialNotification().then(async event => {
      if (event?.notification?.data?.url)
        handleNotificationCallback({
          url: String(event.notification.data.url),
          accountIndex: Number(event.notification.data.accountIndex),
          origin: DeepLinkOrigin.ORIGIN_NOTIFICATION,
          isDevMode: isDeveloperMode
        })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const unsubscribeForegroundEvent = NotificationsService.onForegroundEvent(
      async ({ type, detail }) => {
        await NotificationsService.handleNotificationEvent({
          type,
          detail,
          callback: handleNotificationCallback
        })
      }
    )

    NotificationsService.onBackgroundEvent(async ({ type, detail }) => {
      await NotificationsService.handleNotificationEvent({
        type,
        detail,
        callback: handleNotificationCallback
      })
    })

    return () => {
      unsubscribeForegroundEvent()
    }
  }, [handleNotificationCallback])

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
      setTimeout(() => {
        handleDeeplink(pendingDeepLink, dispatch)
        // once we used the url, we can expire it
        expireDeepLink()
      }, 1000)
    }
  }, [isWalletActive, pendingDeepLink, expireDeepLink, dispatch])

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
