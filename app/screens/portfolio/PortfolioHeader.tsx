import React, {useContext, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AvaListItem from 'screens/portfolio/AvaListItem';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {usePortfolio} from 'screens/portfolio/usePortfolio';
import {useNavigation} from '@react-navigation/native';
import {useWalletStateContext} from '@avalabs/wallet-react-components';
import {Colors} from 'react-native/Libraries/NewAppScreen';

export const HEADER_MAX_HEIGHT = 150;
export const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 60 : 73;
export const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

function PortfolioHeader() {
  const context = useContext(ApplicationContext);
  const navigation = useNavigation();
  const walletStateContext = useWalletStateContext();
  const {addressC, balanceTotalInUSD} = usePortfolio();
  const [walletReady, setWalletReady] = useState<boolean>(false);

  useEffect(() => {
    if (!walletReady) {
      setWalletReady(walletStateContext?.balances !== undefined);
    }
  }, [walletReady, walletStateContext]);

  return (
    <>
      <View pointerEvents="none" style={[styles.header]} />

      <View style={[styles.bar]} pointerEvents="box-none">
        <View>
          <AvaListItem.Account
            accountName={'Account 1'}
            accountAddress={addressC ?? ''}
            onPress={() => {
              console.log('test');
            }}
            onAccountPressed={() => {
              navigation.navigate('AccountBottomSheet');
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
            USD
          </Text>
        </View>
      </View>
    </>
  );
}

// @ts-ignore
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
    height: HEADER_MAX_HEIGHT,
  },
  bar: {
    backgroundColor: 'transparent',
    marginTop: Platform.OS === 'ios' ? 0 : 0,
    height: HEADER_MAX_HEIGHT,
    justifyContent: 'space-between',
    position: 'absolute',
    width: '100%',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingBottom: 8,
  },
});

export default PortfolioHeader;
