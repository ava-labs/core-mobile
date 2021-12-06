import React, {FC, memo} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {
  ApplicationContextState,
  useApplicationContext,
} from 'contexts/ApplicationContext';
import {usePortfolio} from 'screens/portfolio/usePortfolio';
import {useNavigation} from '@react-navigation/native';
import AvaText from 'components/AvaText';
import {PortfolioNavigationProp} from 'screens/portfolio/PortfolioView';
import {Space} from 'components/Space';
import CircularButton from 'components/CircularButton';
import ArrowSVG from 'components/svg/ArrowSVG';
import AppNavigation from 'navigation/AppNavigation';

// experimenting with container pattern and stable props to try to reduce re-renders
function PortfolioHeaderContainer() {
  const context = useApplicationContext();
  const navigation = useNavigation<PortfolioNavigationProp>();
  const {balanceTotalInUSD, isBalanceLoading} = usePortfolio();

  return (
    <PortfolioHeader
      appContext={context}
      navigation={navigation}
      balanceTotalUSD={balanceTotalInUSD}
      isBalanceLoading={isBalanceLoading}
    />
  );
}

interface PortfolioHeaderProps {
  appContext: ApplicationContextState;
  navigation: PortfolioNavigationProp;
  balanceTotalUSD: string;
  isBalanceLoading: boolean;
}

const PortfolioHeader: FC<PortfolioHeaderProps> = memo(
  ({navigation, appContext, balanceTotalUSD = 0, isBalanceLoading = false}) => {
    const theme = appContext.theme;

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
            USD
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
        </View>
      </View>
    );
  },
);

export default PortfolioHeaderContainer;
