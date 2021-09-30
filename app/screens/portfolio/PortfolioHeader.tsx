import React, {FC, memo, useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import AvaListItem from 'components/AvaListItem';
import {
  ApplicationContext,
  ApplicationContextState,
} from 'contexts/ApplicationContext';
import {usePortfolio} from 'screens/portfolio/usePortfolio';
import {
  DrawerActions,
  NavigationProp,
  useNavigation,
} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';

// experimenting with container pattern and stable props to try to reduce re-renders
function PortfolioHeaderContainer() {
  const context = useContext(ApplicationContext);
  const navigation = useNavigation();
  const {addressC, balanceTotalInUSD} = usePortfolio();

  return (
    <PortfolioHeader
      appContext={context}
      navigation={navigation}
      addressC={addressC}
      balanceTotalUSD={balanceTotalInUSD}
    />
  );
}

interface PortfolioHeaderProps {
  appContext: ApplicationContextState;
  navigation: NavigationProp<ReactNavigation.RootParamList>;
  addressC: string;
  balanceTotalUSD: string;
}

const PortfolioHeader: FC<PortfolioHeaderProps> = memo(
  ({navigation, addressC, appContext, balanceTotalUSD = 0}) => {
    return (
      <View pointerEvents="box-none">
        <View>
          <AvaListItem.Account
            accountName={'Account 1'}
            accountAddress={addressC ?? ''}
            onRightComponentPress={() => {
              navigation.navigate(AppNavigation.Wallet.SearchScreen);
            }}
            onLeftComponentPress={() => {
              navigation.dispatch(DrawerActions.openDrawer());
            }}
            onAccountPressed={() => {
              navigation.navigate(AppNavigation.Modal.AccountBottomSheet);
            }}
          />
        </View>
        <View
          style={{
            alignItems: 'flex-end',
            justifyContent: 'center',
            flexDirection: 'row',
          }}>
          <Text style={[styles.text, {color: appContext?.theme.txtOnBgApp}]}>
            {balanceTotalUSD}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: appContext?.theme.txtOnBgApp,
              paddingLeft: 4,
              lineHeight: 28,
            }}>
            USD
          </Text>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  header: {
    overflow: 'hidden',
  },
});

export default PortfolioHeaderContainer;
