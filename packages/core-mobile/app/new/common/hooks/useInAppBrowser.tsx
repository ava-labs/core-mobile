import { resolve } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import Config from 'react-native-config'
import { generateOnRampURL } from '@coinbase/cbpay-js'
import Logger from 'utils/Logger'
import { openInAppBrowser } from 'utils/openInAppBrowser'
import InAppBrowser, {
  InAppBrowserOptions
} from 'react-native-inappbrowser-reborn'
import { useTheme } from '@avalabs/k2-alpine'
import { showSnackbar } from 'common/utils/toast'
import { Linking } from 'react-native'
import { useDisableLockAppStore } from 'features/accountSettings/store'

const moonpayURL = async (address: string): Promise<{ url: string }> => {
  return await fetch(`${Config.PROXY_URL}/moonpay/${address}`).then(response =>
    response.json()
  )
}

const useInAppBrowser = (): {
  openUrl: (url: string) => Promise<void>
  openUrlWithRedirect: (url: string, redirectScheme: string) => Promise<void>
  openCoinBasePay: (address: string) => Promise<void>
  openMoonPay: () => Promise<void>
} => {
  const {
    theme: { colors }
  } = useTheme()
  const addressC = useSelector(selectActiveAccount)?.addressC ?? ''

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

  async function openUrl(url: string): Promise<void> {
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
    openInAppBrowser(url, options)
  }

  async function openUrlWithRedirect(
    url: string,
    redirectScheme: string
  ): Promise<void> {
    try {
      if (await InAppBrowser.isAvailable()) {
        useDisableLockAppStore.setState({ disableLockApp: true })
        const result = await InAppBrowser.openAuth(url, redirectScheme, {
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
          ephemeralWebSession: true,
          // Android Properties
          showTitle: true,
          toolbarColor: colors.$surfacePrimary,
          secondaryToolbarColor: colors.$textPrimary,
          navigationBarColor: colors.$textPrimary,
          navigationBarDividerColor: colors.$surfaceSecondary,
          enableUrlBarHiding: false,
          enableDefaultShare: true,
          forceCloseOnRedirection: true,
          showInRecents: true
        })
        if (result.type === 'success' && result.url) {
          Linking.openURL(result.url).catch(Logger.error)
        }
      } else {
        Linking.openURL(url).catch(Logger.error)
      }
    } catch (e) {
      Linking.openURL(url).catch(Logger.error)
    } finally {
      useDisableLockAppStore.setState({ disableLockApp: false })
    }
  }

  return { openUrl, openUrlWithRedirect, openMoonPay, openCoinBasePay }
}

export default useInAppBrowser
