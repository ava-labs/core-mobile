import React, {FC, memo} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {usePortfolio} from 'screens/portfolio/usePortfolio';
import {useNavigation} from '@react-navigation/native';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import CircularButton from 'components/CircularButton';
import ArrowSVG from 'components/svg/ArrowSVG';
import AppNavigation from 'navigation/AppNavigation';
import BuySVG from 'components/svg/BuySVG';
import useInAppBrowser from 'hooks/useInAppBrowser';
import {RootStackParamList} from 'navigation/WalletScreenStack';
import {StackNavigationProp} from '@react-navigation/stack';

// experimenting with container pattern and stable props to try to reduce re-renders
function PortfolioHeaderContainer() {
  const {balanceTotalInUSD, isBalanceLoading} = usePortfolio();
  const {selectedCurrency, currencyFormatter} = useApplicationContext().appHook;
  const currencyBalance = currencyFormatter(Number(balanceTotalInUSD));

  return (
    <PortfolioHeader
      balanceTotalUSD={currencyBalance}
      isBalanceLoading={isBalanceLoading}
      currencyCode={selectedCurrency}
    />
  );
}

interface PortfolioHeaderProps {
  balanceTotalUSD: string;
  isBalanceLoading: boolean;
  currencyCode: string;
}

const PortfolioHeader: FC<PortfolioHeaderProps> = memo(
  ({balanceTotalUSD = 0, isBalanceLoading = false, currencyCode}) => {
    const {theme} = useApplicationContext();
    const {openMoonPay} = useInAppBrowser();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const sendArrow = (
      <ArrowSVG size={20} color={theme.colorText1} rotate={225} />
    );
    const receiveArrow = (
      <ArrowSVG size={20} color={theme.colorText1} rotate={45} />
    );

    function navigateSend() {
      navigation.navigate(AppNavigation.Wallet.SendTokens);
    }

    function navigateReceive() {
      navigation.navigate(AppNavigation.Wallet.ReceiveTokens);
    }

    function navigateBuy() {
      openMoonPay();
    }

    return (
      <View pointerEvents="box-none">
        <View
          style={{
            alignItems: 'flex-end',
            justifyContent: 'center',
            flexDirection: 'row',
            marginTop: 25,
          }}>
          {isBalanceLoading && (
            <ActivityIndicator style={{alignSelf: 'center'}} size="small" />
          )}
          <AvaText.LargeTitleBold>{balanceTotalUSD}</AvaText.LargeTitleBold>
          <AvaText.Heading3 textStyle={{paddingBottom: 4, marginLeft: 4}}>
            {currencyCode}
          </AvaText.Heading3>
        </View>
        <Space y={18} />
        <View style={{flexDirection: 'row', justifyContent: 'center'}}>
          <CircularButton
            image={sendArrow}
            caption={'Send'}
            onPress={navigateSend}
          />
          <Space x={24} />
          <CircularButton
            image={receiveArrow}
            caption={'Receive'}
            onPress={navigateReceive}
          />
          <Space x={24} />
          <CircularButton
            image={<BuySVG size={26} />}
            caption={'Buy'}
            onPress={navigateBuy}
          />
        </View>
      </View>
    );
  },
);

export default PortfolioHeaderContainer;
