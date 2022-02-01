import React, {FC, memo} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {
  ApplicationContextState,
  useApplicationContext,
} from 'contexts/ApplicationContext';
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
import Clipboard from '@react-native-clipboard/clipboard';
import {ShowSnackBar} from 'components/Snackbar';
import CopySVG from 'components/svg/CopySVG';
import AvaButton from 'components/AvaButton';

// experimenting with container pattern and stable props to try to reduce re-renders
function PortfolioHeaderContainer() {
  const context = useApplicationContext();
  const navigation = useNavigation<PortfolioNavigationProp>();
  const {balanceTotalInUSD, isBalanceLoading, addressC} = usePortfolio();
  const {selectedCurrency, currencyFormatter} = context.appHook;
  const currencyBalance = currencyFormatter(Number(balanceTotalInUSD));

  return (
    <PortfolioHeader
      balanceTotalUSD={currencyBalance}
      isBalanceLoading={isBalanceLoading}
      currencyCode={selectedCurrency}
      addressC={addressC}  
    />
  );
}

interface PortfolioHeaderProps {
  balanceTotalUSD: string;
  isBalanceLoading: boolean;
  currencyCode: string;
  addressC?: string;
}

const PortfolioHeader: FC<PortfolioHeaderProps> = memo(
  ({addressC, appContext, balanceTotalUSD = 0, isBalanceLoading = false, currencyCode}) => {
    const theme = appContext.theme;

    return (
      <View pointerEvents="box-none">
        <AvaButton.Base
          onPress={() => {
            Clipboard.setString(addressC ?? '');
            ShowSnackBar('Copied');
          }}
          style={styles.copyAddressContainer}>
          <CopySVG color={theme.colorText1} size={12} />
          <Space x={8} />
          <AvaText.Body2
            textStyle={{color: theme.colorText1}}
            ellipsize={'middle'}>
            {addressC}
          </AvaText.Body2>
        </AvaButton.Base>
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
        {/*<View style={{flexDirection: 'row', justifyContent: 'center'}}>*/}
        {/*  <CircularButton*/}
        {/*    image={sendArrow}*/}
        {/*    caption={'Send'}*/}
        {/*    onPress={navigateSend}*/}
        {/*  />*/}
        {/*  <Space x={24} />*/}
        {/*  <CircularButton*/}
        {/*    image={receiveArrow}*/}
        {/*    caption={'Receive'}*/}
        {/*    onPress={navigateReceive}*/}
        {/*  />*/}
        {/*  <Space x={24} />*/}
        {/*  <CircularButton*/}
        {/*    image={<BuySVG size={26} />}*/}
        {/*    caption={'Buy'}*/}
        {/*    onPress={navigateBuy}*/}
        {/*  />*/}
        {/*</View>*/}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  copyAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    width: 150,
    alignSelf: 'center',
  },
});

export default PortfolioHeaderContainer;
