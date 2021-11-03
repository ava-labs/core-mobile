import React, {FC, memo, useEffect, useMemo, useRef} from 'react';
import {FlatList, ListRenderItemInfo, Modal, StyleSheet, View} from 'react-native';
import PortfolioHeader from 'screens/portfolio/PortfolioHeader';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {TokenWithBalance} from '@avalabs/wallet-react-components';
import {useSearchableTokenList} from 'screens/portfolio/useSearchableTokenList';
import AppNavigation from 'navigation/AppNavigation';
import {StackNavigationProp} from '@react-navigation/stack';
import {PortfolioStackParamList} from 'navigation/PortfolioStackScreen';
import PortfolioListItem from 'screens/portfolio/components/PortfolioListItem';
import {useSelectedTokenContext} from 'contexts/SelectedTokenContext';
import ZeroState from 'components/ZeroState';
import AvaButton from 'components/AvaButton';
import {usePortfolio} from 'screens/portfolio/usePortfolio';
import Loader from 'components/Loader';

type PortfolioProps = {
  onExit: () => void;
  onSwitchWallet: () => void;
  tokenList?: TokenWithBalance[];
  loadZeroBalanceList?: () => void;
  isRefreshing?: boolean;
  handleRefresh?: () => void;
  hasZeroBalance?: boolean;
};

export type PortfolioNavigationProp =
  StackNavigationProp<PortfolioStackParamList>;

// experimenting with container pattern and stable props to try to reduce re-renders
function PortfolioContainer({
  onExit,
  onSwitchWallet,
}: PortfolioProps): JSX.Element {
  const {tokenList, loadZeroBalanceList, loadTokenList, isRefreshing} =
    useSearchableTokenList();
  const {balanceTotalInUSD, isWalletReady} = usePortfolio();
  const hasZeroBalance =
    !balanceTotalInUSD ||
    balanceTotalInUSD === '0' ||
    balanceTotalInUSD === '$0.00';

  function handleRefresh() {
    loadTokenList();
  }

  return (
    <>
      <PortfolioView
        onExit={onExit}
        onSwitchWallet={onSwitchWallet}
        tokenList={tokenList}
        loadZeroBalanceList={loadZeroBalanceList}
        isRefreshing={isRefreshing}
        handleRefresh={handleRefresh}
        hasZeroBalance={hasZeroBalance}
      />
      <Modal visible={!isWalletReady}>
        <Loader message={'Loading wallet. One moment please.'} />
      </Modal>
    </>
  );
}

const PortfolioView: FC<PortfolioProps> = memo(
  ({
    tokenList,
    loadZeroBalanceList,
    isRefreshing,
    handleRefresh,
    hasZeroBalance,
  }: PortfolioProps) => {
    const listRef = useRef<FlatList>(null);
    const navigation = useNavigation<PortfolioNavigationProp>();
    const {setSelectedToken} = useSelectedTokenContext();

    useEffect(() => {
      const unsubscribe = navigation.addListener('focus', () => {
        loadZeroBalanceList?.();
      });
      return () => navigation.removeListener('focus', unsubscribe);
    }, [navigation]);

    function selectToken(token: TokenWithBalance) {
      setSelectedToken(token);
      navigation.navigate(AppNavigation.Modal.SendReceiveBottomSheet);
    }

    function emptyStateAdditionalItem() {
      return (
        <AvaButton.PrimaryLarge
          style={{marginTop: 32}}
          onPress={() => {
            navigation.navigate(AppNavigation.Modal.ReceiveOnlyBottomSheet);
          }}>
          Receive tokens
        </AvaButton.PrimaryLarge>
      );
    }

    const renderItem = (item: ListRenderItemInfo<TokenWithBalance>) => {
      const token = item.item;
      return (
        <PortfolioListItem
          tokenName={token.name}
          tokenPrice={token.balanceDisplayValue ?? '0'}
          tokenPriceUsd={token.balanceUsdDisplayValue}
          image={token?.logoURI}
          symbol={token.symbol}
          onPress={() => selectToken(token)}
        />
      );
    };

    const zeroState = useMemo(() => {
      return (
        <ZeroState.Portfolio additionalItem={emptyStateAdditionalItem()} />
      );
    }, []);

    return (
      <SafeAreaProvider style={styles.flex}>
        <PortfolioHeader />
        <FlatList
          ref={listRef}
          contentContainerStyle={{paddingHorizontal: 16}}
          style={[styles.tokenList, tokenList?.length === 1 && {flex: 0}]}
          data={tokenList}
          renderItem={renderItem}
          keyExtractor={(item: TokenWithBalance) => item?.symbol}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          scrollEventThrottle={16}
          ListEmptyComponent={zeroState}
        />
        {tokenList?.length === 1 && hasZeroBalance && (
          <View
            style={{
              position: 'absolute',
              top: 200,
              left: 0,
              right: 0,
              bottom: 0,
            }}>
            {zeroState}
          </View>
        )}
      </SafeAreaProvider>
    );
  },
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  tokenList: {
    marginTop: 36,
  },
});

export default PortfolioContainer;
