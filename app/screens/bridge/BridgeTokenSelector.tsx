import React, {RefObject, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  InteractionManager,
  ListRenderItemInfo,
  TextInput,
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
  useTokenInfoContext,
} from '@avalabs/bridge-sdk';
import {getEthereumProvider} from 'screens/bridge/utils/getEthereumProvider';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
import {useGetTokenSymbolOnNetwork} from 'screens/bridge/hooks/useGetTokenSymbolOnNetwork';
import Avatar from 'components/Avatar';
import {
  ERC20WithBalance,
  useNetworkContext,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import {formatTokenAmount} from 'utils/Utils';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Big} from '@avalabs/avalanche-wallet-sdk';
import {AssetBalance} from 'screens/bridge/hooks/useAssetsWithBalances';
import {getAvalancheProvider} from 'screens/bridge/utils/getAvalancheProvider';

const DEFAULT_HORIZONTAL_MARGIN = 16;

export enum SelectTokenMode {
  CONVERT = 'convert', // only list tokens which can be converted and have deprecated token address
  TRANSFER = 'transfer', // list all tokens
}

interface TokenSelectorProps {
  onTokenSelected: (symbol: string) => void;
  horizontalMargin?: number;
  selectMode: SelectTokenMode;
}

function TokenSelector({
  onTokenSelected,
  horizontalMargin = DEFAULT_HORIZONTAL_MARGIN,
}: TokenSelectorProps) {
  const {currentBlockchain} = useBridgeSDK();
  const assetList = useAssets(currentBlockchain);
  const tokenInfoContext = useTokenInfoContext();
  const textInputRef = useRef() as RefObject<TextInput>;
  const {getTokenSymbolOnNetwork} = useGetTokenSymbolOnNetwork();
  const network = useNetworkContext()?.network;
  const {addresses, erc20Tokens} = useWalletStateContext();
  const theme = useApplicationContext().theme;
  const [ethBalances, setEthBalances] = useState<AssetBalance[]>([]);

  const balances = useGetTokenBalances(
    currentBlockchain,
    assetList,
    currentBlockchain === Blockchain.AVALANCHE
      ? getAvalancheProvider(network)
      : getEthereumProvider(network),
    true,
    addresses?.addrC,
  );

  const avalancheBalances = useMemo(() => {
    erc20Tokens.reduce<{
      [address: string]: ERC20WithBalance;
    }>((tokens, token) => {
      // Need to convert the keys to lowercase because they are mixed case, and this messes up or comparison function
      tokens[token.address.toLowerCase()] = token;
      return tokens;
    }, {});
    return Object.values(assetList)
      .filter(
        // assets won't include a NativeAsset (i.e. AVAX) so we're ignoring it
        (asset): asset is ERC20Asset => asset.assetType === AssetType.ERC20,
      )
      .map(asset => {
        const symbol = asset.symbol;
        const balance = balances?.[symbol] ?? BIG_ZERO;
        return {symbol, asset, balance};
      });
  }, [assetList, currentBlockchain, erc20Tokens]);

  useEffect(() => {
    if (currentBlockchain != Blockchain.ETHEREUM) {
      return;
    }
    (async () => {
      const bal = Object.entries(assetList).map(([symbol, asset]) => {
        const balanceStr = balances?.[symbol];
        const balance = balanceStr ? new Big(balanceStr) : undefined;

        return {symbol, asset, balance};
      });

      setEthBalances(bal);
    })();
  }, [addresses.addrC, assetList, currentBlockchain]);

  const assetsWithBalances = (
    currentBlockchain === Blockchain.AVALANCHE ? avalancheBalances : ethBalances
  ).sort((asset1, asset2) => asset2?.balance?.cmp(asset1.balance || 0) || 0);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 300); //delay is for some weird bug effect when opening select token on swap page
    });
  }, [textInputRef]);

  const renderItem = (item: ListRenderItemInfo<AssetBalance>) => {
    const token = item.item;
    const symbol = token.asset.symbol;
    const name = token.symbol === 'ETH' ? 'Ethereum' : token.asset.tokenName;

    const tokenSymbol = getTokenSymbolOnNetwork(symbol, currentBlockchain);
    const tokenLogo = () => {
      return (
        <Avatar.Custom
          name={name}
          symbol={symbol}
          logoUri={tokenInfoContext?.[symbol.toLowerCase()]?.logo}
        />
      );
    };

    const balance = token.balance;

    return (
      <AvaListItem.Base
        title={name}
        leftComponent={tokenLogo()}
        rightComponent={
          balance ? (
            <>
              <AvaText.Body1>
                {formatTokenAmount(token.balance || new Big(0), 6)}{' '}
                {tokenSymbol}
              </AvaText.Body1>
            </>
          ) : (
            <ActivityIndicator size={'small'} color={theme.accentColor} />
          )
        }
        onPress={() => {
          onTokenSelected(symbol);
        }}
      />
    );
  };

  // const handleSearch = (text: string) => {
  //   setSearchText(text);
  // };

  // function getNoResultsText() {
  //   if (
  //     !filteredTokenList ||
  //     (filteredTokenList &&
  //       filteredTokenList?.length === 0 &&
  //       (!searchText || (searchText && searchText.length === 0)))
  //   ) {
  //     return 'You have no tokens to send';
  //   }
  //   return undefined;
  // }

  console.log('token info: ' + tokenInfoContext.eth);

  return (
    <View style={{flex: 1, marginHorizontal: horizontalMargin}}>
      {/*<SearchBar onTextChanged={handleSearch} searchText={searchText} />*/}
      <Space y={16} />
      {!assetList ? (
        <Loader />
      ) : (
        <FlatList
          keyboardShouldPersistTaps="handled"
          data={assetsWithBalances}
          renderItem={renderItem}
          refreshing={false}
          keyExtractor={(item: AssetBalance, index) => item.symbol + index}
        />
      )}
    </View>
  );
}

export default TokenSelector;
