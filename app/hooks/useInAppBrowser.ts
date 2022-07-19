import { InAppBrowser } from 'react-native-inappbrowser-reborn'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Alert, Linking } from 'react-native'
import { resolve } from '@avalabs/utils-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'

const moonpayURL = async (address: string): Promise<{ url: string }> => {
  return await fetch(`${process.env.GLACIER_PROD_URL}/moonpay/${address}`).then(
    response => response.json()
  )
}

const useInAppBrowser = () => {
  const { theme } = useApplicationContext()
  const addressC = useSelector(selectActiveAccount)?.address ?? ''

  function failSafe(url: string) {
    Linking.openURL(url)
  }

  async function openMoonPay() {
    const [result, error] = await resolve(moonpayURL(addressC))

    const moonpayUrl = result?.url ?? ''

    Alert.alert(
      !error ? 'Attention' : 'Oh-oh',
      !error
        ? "Clicking “Continue” will take you to a page powered by our partner MoonPay, use is subject to MoonPay's terms and policies"
        : 'We cannot send your to our partner, MoonPay, at this time. Please try again soon',
      !error
        ? [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Continue',
              onPress: () => {
                openUrl(moonpayUrl)
              }
            }
          ]
        : [
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
    )
  }

  async function openUrl(url: string) {
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

  return { openUrl, openMoonPay }
}

export default useInAppBrowser
