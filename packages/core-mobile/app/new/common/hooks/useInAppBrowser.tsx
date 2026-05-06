import { resolve } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import Config from 'react-native-config'
import { generateOnRampURL } from '@coinbase/cbpay-js'
import Logger from 'utils/Logger'
import {
  openInAppBrowser,
  openInAppBrowserForAuth
} from 'utils/openInAppBrowser'
import { InAppBrowserOptions } from 'react-native-inappbrowser-reborn'
import { useTheme } from '@avalabs/k2-alpine'
import { showSnackbar } from 'common/utils/toast'
import { Platform } from 'react-native'
import { DeepLink, DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'

const moonpayURL = async (address: string): Promise<{ url: string }> => {
  return await fetch(`${Config.PROXY_URL}/moonpay/${address}`).then(response =>
    response.json()
  )
}

const useInAppBrowser = (): {
  openUrl: (url: string, redirectUrl?: string) => Promise<void>
  openCoinBasePay: (address: string) => Promise<void>
  openMoonPay: () => Promise<void>
} => {
  const {
    theme: { colors }
  } = useTheme()
  const addressC = useSelector(selectActiveAccount)?.addressC ?? ''
  const { setPendingDeepLink } = useDeeplink()

  async function openMoonPay(): Promise<void> {
    const [result, error] = await resolve(moonpayURL(addressC))
    if (error) {
      return showSnackbar(
        'We cannot send your to our partner, MoonPay, at this time. Please try again soon'
      )
    } else {
      const moonpayUrl = result?.url ?? ''
      return openUrl(moonpayUrl)
    }
  }

  const openCoinBasePay = async (address: string): Promise<void> => {
    const appId = Config.COINBASE_APP_ID
    if (!appId) {
      return showSnackbar(
        'We cannot send your to our partner, Coinbase, at this time. Please try again soon'
      )
    }
    const coinbaseUrl = generateOnRampURL({
      appId,
      addresses: { [address]: ['avacchain'] },
      assets: ['AVAX'],
      defaultExperience: 'buy'
    })
    openUrl(coinbaseUrl).catch(Logger.error)
  }

  async function openUrl(url: string, redirectUrl?: string): Promise<void> {
    const options: InAppBrowserOptions = {
      // iOS Properties
      dismissButtonStyle: 'close',
      preferredBarTintColor: colors.$surfacePrimary,
      preferredControlTintColor: colors.$textPrimary,
      readerMode: false,
      animated: true,
      modalPresentationStyle: 'fullScreen',
      modalTransitionStyle: 'coverVertical',
      modalEnabled: true,
      enableBarCollapsing: false,
      // Android Properties
      showTitle: true,
      toolbarColor: colors.$surfacePrimary,
      secondaryToolbarColor: colors.$textPrimary,
      navigationBarColor: colors.$textPrimary,
      navigationBarDividerColor: colors.$surfaceSecondary,
      enableUrlBarHiding: false,
      enableDefaultShare: true,
      forceCloseOnRedirection: false,
      showInRecents: true
    }
    if (Platform.OS === 'ios' && redirectUrl) {
      const callbackUrl = await openInAppBrowserForAuth(
        url,
        redirectUrl,
        options
      )
      if (callbackUrl) {
        setPendingDeepLink({
          url: callbackUrl,
          origin: DeepLinkOrigin.ORIGIN_IN_APP_BROWSER
        } as DeepLink)
      }
      return
    }
    await openInAppBrowser(url, options)
  }

  return { openUrl, openMoonPay, openCoinBasePay }
}

export default useInAppBrowser
