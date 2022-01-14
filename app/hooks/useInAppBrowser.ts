import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Alert, Linking} from 'react-native';
import Config from 'react-native-config';
import {
  FUJI_NETWORK,
  useNetworkContext,
} from '@avalabs/wallet-react-components';

const useInAppBrowser = () => {
  const {theme} = useApplicationContext();
  const networkContext = useNetworkContext();
  const isTestnet = networkContext?.network === FUJI_NETWORK;

  function failSafe(url: string) {
    Linking.openURL(url);
  }

  function openMoonPay() {
    const apiKey = isTestnet
      ? Config.MOONPAY_DEV_API_KEY
      : Config.MOONPAY_PROD_API_KEY;
    const apiBaseUrl = isTestnet
      ? Config.MOONPAY_DEV_URL
      : Config.MOONPAY_PROD_URL;
    const widgetConfigs = {
      apiKey,
      defaultCurrencyCode: 'avax',
      colorCode: theme.colorPrimary1,
    };
    const params = new URLSearchParams(widgetConfigs);
    const url = `${apiBaseUrl}?${params.toString()}`;
    Alert.alert(
      'Attention',
      'Clicking “Continue” will take you to a page powered by our partner MoonPay, data entered here will not be stored by CoreX',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: () => {
            openUrl(url);
          },
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
