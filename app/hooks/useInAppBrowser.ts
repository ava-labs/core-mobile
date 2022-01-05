import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Alert, Linking} from 'react-native';

const MOONPAY_URL = 'https://buy-staging.moonpay.io';

const useInAppBrowser = () => {
  const {theme, appHook} = useApplicationContext();

  function failSafe(url: string) {
    Linking.openURL(url);
  }

  function openMoonPay() {
    const widgetConfigs = {
      apiKey: 'pk_test_P43YhsrWQjnnnJcGWE8UFeHwYstSJ',
      defaultCurrencyCode: 'avax',
      colorCode: theme.colorPrimary1,
    };
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
            appHook.setBackFromWhitelistedProcess(true);
            const params = new URLSearchParams(widgetConfigs);
            const url = `${MOONPAY_URL}?${params.toString()}`;
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
