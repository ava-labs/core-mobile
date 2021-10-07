import React, {FC, memo, useEffect, useRef} from 'react';
import {FlatList, ListRenderItemInfo, StyleSheet} from 'react-native';
import AvaListItem from 'components/AvaListItem';
import PortfolioHeader from 'screens/portfolio/PortfolioHeader';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {ERC20} from '@avalabs/wallet-react-components';
import {AvaxToken} from 'dto/AvaxToken';
import {useSearchableTokenList} from 'screens/portfolio/useSearchableTokenList';
import AppNavigation from 'navigation/AppNavigation';
import {StackNavigationProp} from '@react-navigation/stack';
import {PortfolioStackParamList} from 'navigation/PortfolioStackScreen';
import PortfolioListItem from 'screens/portfolio/components/PortfolioListItem';

type PortfolioProps = {
  onExit: () => void;
  onSwitchWallet: () => void;
  tokenList?: (ERC20 | AvaxToken)[];
  loadZeroBalanceList: () => void;
};

export type PortfolioRouteProp = StackNavigationProp<
  PortfolioStackParamList,
  'PortfolioScreen'
>;

// experimenting with container pattern and stable props to try to reduce re-renders
function PortfolioContainer({onExit, onSwitchWallet}: PortfolioProps) {
  const {tokenList, loadZeroBalanceList} = useSearchableTokenList();

  return (
    <PortfolioView
      onExit={onExit}
      onSwitchWallet={onSwitchWallet}
      tokenList={tokenList}
      loadZeroBalanceList={loadZeroBalanceList}
    />
  );
}

const PortfolioView: FC<PortfolioProps> = memo(
  ({tokenList, loadZeroBalanceList}: PortfolioProps) => {
    const listRef = useRef<FlatList>(null);
    const navigation = useNavigation<PortfolioRouteProp>();

    useEffect(() => {
      const unsubscribe = navigation.addListener('focus', () => {
        loadZeroBalanceList();
      });
      return () => unsubscribe();
    }, [navigation]);

    function showBottomSheet(token: ERC20 | AvaxToken) {
      navigation.navigate(AppNavigation.Modal.SendReceiveBottomSheet, {token});
    }

    const renderItem = (item: ListRenderItemInfo<ERC20 | AvaxToken>) => {
      const token = item.item;
      const logoUri = (token as ERC20)?.logoURI ?? undefined;

      return (
        <PortfolioListItem
          tokenName={token.name}
          tokenPrice={token.balanceParsed}
          image={logoUri}
          symbol={token.symbol}
          onPress={() => showBottomSheet(token)}
        />
      );
    };

    return (
      <SafeAreaProvider style={styles.flex}>
        <PortfolioHeader />
        <FlatList
          ref={listRef}
          style={styles.tokenList}
          data={tokenList}
          renderItem={renderItem}
          keyExtractor={(item: ERC20 | AvaxToken) => item.symbol}
          scrollEventThrottle={16}
        />
      </SafeAreaProvider>
    );
  },
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  tokenList: {
    flex: 1,
    marginTop: 36,
  },
});

export default PortfolioContainer;
