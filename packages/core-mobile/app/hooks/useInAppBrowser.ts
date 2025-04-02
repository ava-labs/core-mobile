import { useApplicationContext } from 'contexts/ApplicationContext'
import { resolve } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import Config from 'react-native-config'
import { showSimpleToast } from 'components/Snackbar'
import { generateOnRampURL } from '@coinbase/cbpay-js'
import Logger from 'utils/Logger'
import { openInAppBrowser } from 'utils/openInAppBrowser'
import { InAppBrowserOptions } from 'react-native-inappbrowser-reborn'
import { moonpayURL } from 'new/common/consts/urls'

const useInAppBrowser = (): {
  openUrl: (url: string) => Promise<void>
  openCoinBasePay: (address: string) => Promise<void>
  openMoonPay: () => Promise<void>
} => {
  const { theme } = useApplicationContext()
  const addressC = useSelector(selectActiveAccount)?.addressC ?? ''

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
      forceCloseOnRedirection: false,
      showInRecents: true
    }
    openInAppBrowser(url, options)
  }

  return { openUrl, openMoonPay, openCoinBasePay }
}

export default useInAppBrowser
