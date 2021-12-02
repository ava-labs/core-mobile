import React, {FC, memo} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {
  ApplicationContextState,
  useApplicationContext,
} from 'contexts/ApplicationContext';
import {usePortfolio} from 'screens/portfolio/usePortfolio';
import {DrawerActions, useNavigation} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';
import MenuSVG from 'components/svg/MenuSVG';
import CarrotSVG from 'components/svg/CarrotSVG';
import AvaText from 'components/AvaText';
import {PortfolioNavigationProp} from 'screens/portfolio/PortfolioView';
import AvaButton from 'components/AvaButton';
import SwitchesSVG from 'components/svg/SwitchesSVG';
import {useSelectedAccountContext} from 'contexts/SelectedAccountContext';
import {Space} from 'components/Space';
import CircularButton from 'components/CircularButton';
import ArrowSVG from 'components/svg/ArrowSVG';

// experimenting with container pattern and stable props to try to reduce re-renders
function PortfolioHeaderContainer() {
  const context = useApplicationContext();
  const navigation = useNavigation<PortfolioNavigationProp>();
  const {balanceTotalInUSD, isBalanceLoading} = usePortfolio();
  const {selectedAccount} = useSelectedAccountContext();

  return (
    <PortfolioHeader
      appContext={context}
      navigation={navigation}
      balanceTotalUSD={balanceTotalInUSD}
      accountName={selectedAccount?.title ?? ''}
      isBalanceLoading={isBalanceLoading}
    />
  );
}

interface PortfolioHeaderProps {
  appContext: ApplicationContextState;
  navigation: PortfolioNavigationProp;
  balanceTotalUSD: string;
  accountName: string;
  isBalanceLoading: boolean;
}

const PortfolioHeader: FC<PortfolioHeaderProps> = memo(
  ({
    navigation,
    appContext,
    balanceTotalUSD = 0,
    accountName,
    isBalanceLoading = false,
  }) => {
    const theme = appContext.theme;

    const sendArrow = (
      <ArrowSVG size={20} color={theme.colorText1} rotate={225} />
    );
    const receiveArrow = (
      <ArrowSVG size={20} color={theme.colorText1} rotate={45} />
    );

    function onAccountPressed() {
      navigation.navigate(AppNavigation.Modal.AccountBottomSheet);
    }

    return (
      <View pointerEvents="box-none">
        <View
          style={{
            marginTop: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
          <AvaButton.Icon
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <MenuSVG />
          </AvaButton.Icon>
          <AvaButton.Base onPress={onAccountPressed}>
            <View style={[styles.accountTitleContainer]}>
              <AvaText.Heading3
                ellipsize={'middle'}
                textStyle={{marginRight: 16}}>
                {accountName}
              </AvaText.Heading3>
              <View style={{transform: [{rotate: '90deg'}]}}>
                <CarrotSVG color={theme.txtListItem} />
              </View>
            </View>
          </AvaButton.Base>
          <AvaButton.Icon
            style={{marginRight: 8}}
            onPress={() =>
              navigation.navigate(AppNavigation.Wallet.SearchScreen)
            }>
            <SwitchesSVG />
          </AvaButton.Icon>
        </View>
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
          <CircularButton image={sendArrow} caption={'Send'} />
          <Space x={24} />
          <CircularButton image={receiveArrow} caption={'Receive'} />
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  accountTitleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
});

export default PortfolioHeaderContainer;
