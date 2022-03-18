import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Alert, Linking} from 'react-native';
import {useWalletStateContext} from '@avalabs/wallet-react-components';
import {Moonpay} from '@avalabs/blizzard-sdk';

const useInAppBrowser = () => {
  const {theme} = useApplicationContext();
  const moonAPI = new Moonpay({baseURL: 'https://blizzard.avax.network/'});
  const addressC = useWalletStateContext()?.addresses?.addrC ?? '';

  function failSafe(url: string) {
    Linking.openURL(url);
  }

  async function openMoonPay() {
    const moonpayUrl = (
      await moonAPI.getUrl(addressC, {color: theme.colorPrimary1})
    ).data;

    Alert.alert(
      moonpayUrl ? 'Attention' : 'Oh-oh',
      moonpayUrl
        ? "Clicking “Continue” will take you to a page powered by our partner MoonPay, use is subject to MoonPay's terms and policies"
        : 'We cannot send your to our partner, MoonPay, at this time. Please try again soon',
      moonpayUrl
        ? [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Continue',
              onPress: () => {
                openUrl(moonpayUrl);
              },
            },
          ]
        : [
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
    );
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
          forceCloseOnRedirection: false,
        });
      } else {
        failSafe(url);
      }
    } catch (e) {
      failSafe(url);
    }
  }

  return {openUrl, openMoonPay};
};

export default useInAppBrowser;
