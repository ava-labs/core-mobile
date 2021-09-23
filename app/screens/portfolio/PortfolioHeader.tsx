import React, {useContext} from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import AvaListItem from 'screens/portfolio/AvaListItem';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {usePortfolio} from 'screens/portfolio/usePortfolio';
import {useNavigation} from '@react-navigation/native';
import {useWalletStateContext} from '@avalabs/wallet-react-components';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import AppNavigation from 'navigation/AppNavigation';
import {PortfolioRouteProp} from 'screens/portfolio/PortfolioView';

export const HEADER_MAX_HEIGHT = 150;
export const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 60 : 73;
export const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

function PortfolioHeader() {
  const context = useContext(ApplicationContext);
  const navigation = useNavigation();
  const {addressC, balanceTotalInUSD} = usePortfolio();

  return (
    <View pointerEvents="box-none">
      <View>
        <AvaListItem.Account
          accountName={'Account 1'}
          accountAddress={addressC ?? ''}
          onRightComponentPress={() => {
            navigation.navigate(AppNavigation.Wallet.SearchScreen);
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
        {!walletReady && (
          <ActivityIndicator
            size="small"
            color={context.isDarkMode ? Colors.white : Colors.black}
          />
        )}
        {walletReady && (
          <Text style={[styles.text, {color: context.theme.txtOnBgApp}]}>
            {balanceTotalInUSD}
          </Text>
        )}
        <Text
          style={{
            fontSize: 16,
            color: context.theme.txtOnBgApp,
            paddingLeft: 4,
            lineHeight: 28,
          }}>
          <Text style={[styles.text, {color: context.theme.txtOnBgApp}]}>
            {balanceTotalInUSD}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: context.theme.txtOnBgApp,
              paddingLeft: 4,
              lineHeight: 28,
            }}>
            USD
          </Text>
        </View>
      </View>
    </View>
  );
}

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

export default PortfolioHeader;
