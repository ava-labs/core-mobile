import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  View,
} from 'react-native';
import Loader from 'components/Loader';
import {Space} from 'components/Space';
import {
  AssetType,
  BIG_ZERO,
  Blockchain,
  ERC20Asset,
  useAssets,
  useBridgeSDK,
  useGetTokenBalances,
} from '@avalabs/bridge-sdk';
import {getEthereumProvider} from 'screens/bridge/utils/getEthereumProvider';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
import {useGetTokenSymbolOnNetwork} from 'screens/bridge/hooks/useGetTokenSymbolOnNetwork';
import Avatar from 'components/Avatar';
import {
  useNetworkContext,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import {formatTokenAmount} from 'utils/Utils';
import {Big} from '@avalabs/avalanche-wallet-sdk';
import {getAvalancheProvider} from 'screens/bridge/utils/getAvalancheProvider';
import SearchBar from 'components/SearchBar';
import useBridge from 'screens/bridge/hooks/useBridge';
import {AssetBalance} from 'screens/bridge/AssetBalance';
import {BottomSheetFlatList} from '@gorhom/bottom-sheet';

const DEFAULT_HORIZONTAL_MARGIN = 16;

// for future use
export enum SelectTokenMode {
  CONVERT = 'convert', // only list tokens which can be converted and have deprecated token address
  TRANSFER = 'transfer', // list all tokens
}

interface TokenSelectorProps {
  onTokenSelected: (symbol: string) => void;
  horizontalMargin?: number;
  selectMode: SelectTokenMode;
}

function BridgeTokenSelector({
  onTokenSelected,
  horizontalMargin = DEFAULT_HORIZONTAL_MARGIN,
}: TokenSelectorProps) {
  const {currentBlockchain} = useBridgeSDK();
  const assetList = useAssets(currentBlockchain);
  const {getTokenSymbolOnNetwork} = useGetTokenSymbolOnNetwork();
  const network = useNetworkContext()?.network;
  // @ts-ignore addresses exist in walletContext
  const {addresses} = useWalletStateContext();
  const [searchText, setSearchText] = useState('');
  const {tokenInfoContext} = useBridge();

  /**
   * Get asset balances for the current blockchain
   */
  const balances = useGetTokenBalances(
    currentBlockchain,
    assetList,
    currentBlockchain === Blockchain.AVALANCHE
      ? getAvalancheProvider(network)
      : getEthereumProvider(network),
    true,
    addresses?.addrC,
  );

  /**
   * Avalanche blockchain assets balances formatted as AssetBalance;
   */
  const avalancheBalances = useMemo(() => {
    return Object.values(assetList)
      .filter(
        // assets won't include a NativeAsset (i.e. AVAX) so we're ignoring it
        (asset): asset is ERC20Asset => asset.assetType === AssetType.ERC20,
      )
      .map(asset => {
        const symbol = asset.symbol;
        const balance = balances?.[symbol] ?? BIG_ZERO;
        console.log(symbol + ': ' + asset.wrappedContractAddress);
        return {symbol, asset, balance};
      });
  }, [assetList, currentBlockchain, balances]);

  /**
   * Ethereum blockchain assets balances formatted as AssetBalance;
   */
  const ethereumBalances = useMemo(() => {
    return Object.entries(assetList).map(([symbol, asset]) => {
      const balanceStr = balances?.[symbol];
      const balance = balanceStr ? new Big(balanceStr) : undefined;

      return {symbol, asset, balance};
    });
  }, [addresses.addrC, assetList, currentBlockchain, balances]);

  /**
   * Pick the dataset based on the blockchain and sort it
   */
  const assetsWithBalances = (
    currentBlockchain === Blockchain.AVALANCHE
      ? avalancheBalances
      : ethereumBalances
  ).sort((asset1, asset2) => asset2?.balance?.cmp(asset1.balance || 0) || 0);

  const renderItem = (item: ListRenderItemInfo<AssetBalance>) => {
    const token = item.item;
    const symbol = token.asset.symbol;
    const name = token.symbol === 'ETH' ? 'Ethereum' : token.asset.tokenName;
    const tokenSymbolOnNetwork = getTokenSymbolOnNetwork(
      symbol,
      currentBlockchain,
    );
    const tokenLogo = () => {
      return (
        <Avatar.Custom
          name={name}
          symbol={symbol}
          logoUri={tokenInfoContext?.[tokenSymbolOnNetwork]?.logo}
        />
      );
    };

    return (
      <AvaListItem.Base
        title={name}
        leftComponent={tokenLogo()}
        rightComponentVerticalAlignment={'center'}
        rightComponent={
          token.balance ? (
            <>
              <AvaText.Body1>
                {formatTokenAmount(token.balance || new Big(0), 6)}{' '}
                {tokenSymbolOnNetwork}
              </AvaText.Body1>
            </>
          ) : (
            <ActivityIndicator size={'small'} />
          )
        }
        onPress={() => {
          onTokenSelected(symbol);
        }}
      />
    );
  };

  /**
   * filter
   */
  const tokens = useMemo(() => {
    return searchText && searchText.length > 0
      ? assetsWithBalances?.filter(
          i =>
            i.asset.tokenName
              ?.toLowerCase()
              .includes(searchText.toLowerCase()) ||
            i.symbol?.toLowerCase().includes(searchText.toLowerCase()),
        )
      : assetsWithBalances;
  }, [assetsWithBalances, searchText]);

  return (
    <View style={{flex: 1, marginHorizontal: horizontalMargin}}>
      <SearchBar onTextChanged={setSearchText} searchText={searchText} />
      <Space y={16} />
      {!assetList ? (
        <Loader />
      ) : (
        <BottomSheetFlatList
          keyboardShouldPersistTaps="handled"
          data={tokens}
          renderItem={renderItem}
          refreshing={false}
          keyExtractor={(item: AssetBalance, index) => item.symbol + index}
        />
      )}
    </View>
  );
}

export default BridgeTokenSelector;
