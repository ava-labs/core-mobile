import { InAppBrowser } from 'react-native-inappbrowser-reborn'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Linking } from 'react-native'
import { resolve } from '@avalabs/utils-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import Config from 'react-native-config'
import { showSimpleToast } from 'components/Snackbar'
import { generateOnRampURL } from '@coinbase/cbpay-js'
import Logger from 'utils/Logger'

const moonpayURL = async (address: string): Promise<{ url: string }> => {
  return await fetch(`${Config.PROXY_URL}/moonpay/${address}`).then(response =>
    response.json()
  )
}

const useInAppBrowser = (): {
  openUrl: (url: string) => Promise<void>
  openCoinBasePay: (address: string) => Promise<void>
  openMoonPay: () => Promise<void>
} => {
  const { theme } = useApplicationContext()
  const addressC = useSelector(selectActiveAccount)?.addressC ?? ''

  function failSafe(url: string): void {
    Linking.openURL(url).catch(Logger.error)
  }

  async function openMoonPay(): Promise<void> {
    const [result, error] = await resolve(moonpayURL(addressC))
    if (error) {
      return showSimpleToast(
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
      return showSimpleToast(
        'We cannot send your to our partner, Coinbase, at this time. Please try again soon'
      )
    }
    const coinbaseUrl = generateOnRampURL({
      appId,
      destinationWallets: [
        {
          address,
          assets: ['AVAX', 'ETH']
        }
      ]
    })
    return openUrl(coinbaseUrl)
  }

  async function openUrl(url: string): Promise<void> {
    try {
      if (await InAppBrowser.isAvailable()) {
        InAppBrowser.open(url, {
          // iOS Properties
          dismissButtonStyle: 'close',
          preferredBarTintColor: theme.background,
          preferredControlTintColor: theme.colorText1,
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          modalEnabled: true,
          enableBarCollapsing: false,
          // Android Properties
          showTitle: true,
          toolbarColor: theme.background,
          secondaryToolbarColor: 'black',
          navigationBarColor: 'black',
          navigationBarDividerColor: 'white',
          enableUrlBarHiding: false,
          enableDefaultShare: true,
          forceCloseOnRedirection: false
        })
      } else {
        failSafe(url)
      }
    } catch (e) {
      failSafe(url)
    }
  }

  return { openUrl, openMoonPay, openCoinBasePay }
}

export default useInAppBrowser
