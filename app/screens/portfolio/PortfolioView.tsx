import React, {FC, memo, useContext, useEffect, useRef, useState} from 'react';
import {FlatList, ListRenderItemInfo, StyleSheet} from 'react-native';
import PortfolioHeader from 'screens/portfolio/PortfolioHeader';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {TokenWithBalance} from '@avalabs/wallet-react-components';
import {useSearchableTokenList} from 'screens/portfolio/useSearchableTokenList';
import AppNavigation from 'navigation/AppNavigation';
import {StackNavigationProp} from '@react-navigation/stack';
import {PortfolioStackParamList} from 'navigation/PortfolioStackScreen';
import PortfolioListItem from 'screens/portfolio/components/PortfolioListItem';
import {SelectedTokenContext} from 'contexts/SelectedTokenContext';

type PortfolioProps = {
  onExit: () => void;
  onSwitchWallet: () => void;
  tokenList?: TokenWithBalance[];
  loadZeroBalanceList: () => void;
  isRefreshing: boolean;
  handleRefresh: () => void;
};

export type PortfolioRouteProp = StackNavigationProp<
  PortfolioStackParamList,
  'PortfolioScreen'
>;

// experimenting with container pattern and stable props to try to reduce re-renders
function PortfolioContainer({
  onExit,
  onSwitchWallet,
}: PortfolioProps): JSX.Element {
  const {tokenList, loadZeroBalanceList, loadTokenList, isRefreshing} =
    useSearchableTokenList();

  function handleRefresh() {
    loadTokenList();
  }

  return (
    <PortfolioView
      onExit={onExit}
      onSwitchWallet={onSwitchWallet}
      tokenList={tokenList}
      loadZeroBalanceList={loadZeroBalanceList}
      isRefreshing={isRefreshing}
      handleRefresh={handleRefresh}
    />
  );
}

const PortfolioView: FC<PortfolioProps> = memo(
  ({
    tokenList,
    loadZeroBalanceList,
    isRefreshing,
    handleRefresh,
  }: PortfolioProps) => {
    const listRef = useRef<FlatList>(null);
    const navigation = useNavigation<PortfolioRouteProp>();
    const {setSelectedToken} = useContext(SelectedTokenContext);

    useEffect(() => {
      const unsubscribe = navigation.addListener('focus', () => {
        loadZeroBalanceList();
      });
      return () => navigation.removeListener('focus', unsubscribe);
    }, [navigation]);

    function selectToken(token: TokenWithBalance) {
      setSelectedToken(token);
      navigation.navigate(AppNavigation.Modal.SendReceiveBottomSheet);
    }

    const renderItem = (item: ListRenderItemInfo<TokenWithBalance>) => {
      const token = item.item;
      const logoUri = token.logoURI ?? undefined;

      return (
        <PortfolioListItem
          tokenName={token.name}
          tokenPrice={token.balanceDisplayValue}
          tokenPriceUsd={token.balanceUsdDisplayValue}
          image={logoUri}
          symbol={token.symbol}
          onPress={() => selectToken(token)}
        />
      );
    };

    return (
      <SafeAreaProvider style={styles.flex}>
        <PortfolioHeader />
        <FlatList
          ref={listRef}
          contentContainerStyle={{paddingHorizontal: 16}}
          style={styles.tokenList}
          data={tokenList}
          renderItem={renderItem}
          keyExtractor={(item: TokenWithBalance) => item.symbol}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
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
