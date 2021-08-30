import React, {useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import SearchHeader, {
  SearchHeaderProps,
} from 'screens/portfolio/components/SearchHeader';
import {usePortfolio} from 'screens/portfolio/PortfolioHook';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import PortfolioActionButton from './components/PortfolioActionButton';
import AvaListItem from 'screens/portfolio/AvaListItem';
import LinearGradient from 'react-native-linear-gradient';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface PortfolioHeaderProps {
  wallet: MnemonicWallet;
}

type Props = PortfolioHeaderProps & SearchHeaderProps;

function PortfolioHeader({wallet, searchText, onSearchTextChanged}: Props) {
  const [avaxPrice, walletEvmAddrBech] = usePortfolio(wallet);
  const context = useContext(ApplicationContext);
  const isDarkMode = context.isDarkMode;
  return (
    <LinearGradient
      colors={isDarkMode ? ['#00000000', '#0d0711'] : ['#FFF', '#C29BF9']}
      style={{
        flex: 1,
        justifyContent: 'space-between',
      }}>
      <View>
        <AvaListItem.Account
          accountName={'My Awesome Wallet'}
          accountAddress={walletEvmAddrBech ?? ''}
        />
      </View>
      <View key={0} style={styles.center}>
        <Text
          style={{
            fontWeight: 'bold',
            fontSize: 36,
            lineHeight: 44,
            color: context.theme.buttonIcon,
          }}>
          {`$${avaxPrice} USD`}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 60,
          paddingBottom: 46,
        }}>
        <PortfolioActionButton.Send />
        <View style={{paddingHorizontal: 24}}>
          <PortfolioActionButton.Receive />
        </View>
        <PortfolioActionButton.Buy />
      </View>
      <SearchHeader
        searchText={searchText}
        onSearchTextChanged={text => {
          onSearchTextChanged(text);
          console.log('search header:' + text);
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    padding: 20,
  },
  dotContainer: {
    justifyContent: 'center',
    alignSelf: 'center',
    paddingBottom: 16,
  },
});

export default PortfolioHeader;
