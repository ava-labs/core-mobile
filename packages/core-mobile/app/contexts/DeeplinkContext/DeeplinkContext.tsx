import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectWalletState, WalletState } from 'store/app'
import { noop } from '@avalabs/core-utils-sdk'
import { Linking } from 'react-native'
import NotificationsService from 'services/notifications/NotificationsService'
import Logger from 'utils/Logger'
import { selectIsEarnBlocked, selectIsNotificationBlocked } from 'store/posthog'
import { FIDO_CALLBACK_URL } from 'services/passkey/consts'
import { processNotificationData } from 'store/notifications'
import { handleDeeplink } from './utils/handleDeeplink'
import {
  DeepLink,
  DeeplinkContextType,
  DeepLinkOrigin,
  HandleNotificationCallback,
  NotificationData
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
  const walletState = useSelector(selectWalletState)
  const isWalletActive = walletState === WalletState.ACTIVE
  const isNotificationBlocked = useSelector(selectIsNotificationBlocked)
  const isEarnBlocked = useSelector(selectIsEarnBlocked)
  const [pendingDeepLink, setPendingDeepLink] = useState<DeepLink>()

  const handleNotificationCallback: HandleNotificationCallback = useCallback(
    (data: NotificationData | undefined) => {
      if (!data) {
        Logger.error(
          `[DeeplinkContext.tsx][handleNotificationCallback] no data`
        )
        return
      }
      if (!data.url) {
        Logger.error(`[DeeplinkContext.tsx][handleNotificationCallback] no url`)
        return
      }
      const runCallback = (): void => {
        dispatch(processNotificationData({ data }))
      }
      setPendingDeepLink({
        url: data.url as string,
        origin: DeepLinkOrigin.ORIGIN_NOTIFICATION,
        callback: runCallback
      })
    },
    [dispatch]
  )

  /******************************************************************************
   * Start listeners that will receive the deep link url
   *****************************************************************************/
  useEffect(() => {
    if (isNotificationBlocked) return
    NotificationsService.getInitialNotification(
      handleNotificationCallback
    ).catch(reason => {
      Logger.error(`[DeeplinkContext.tsx][getInitialNotification]${reason}`)
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
      Logger.error(`[DeeplinkContext.tsx][checkInitialUrl]${reason}`)
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
      handleDeeplink(pendingDeepLink, dispatch, isEarnBlocked)
      // once we used the url, we can expire it
      setPendingDeepLink(undefined)
    }
  }, [isWalletActive, pendingDeepLink, dispatch, isEarnBlocked])

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
