import React, {RefObject, useEffect, useRef, useState} from 'react';
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
  Asset,
  AssetType,
  Blockchain,
  useAssets,
  useBridgeSDK,
  useGetTokenBalances,
  useTokenInfoContext,
} from '@avalabs/bridge-sdk';
import {getEthereumProvider} from 'screens/bridge/utils/getEthereumProvider';
import {getAvalancheProvider} from 'screens/bridge/utils/getAvalancheProvider';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
import {useGetTokenSymbolOnNetwork} from 'screens/bridge/hooks/useGetTokenSymbolOnNetwork';
import Avatar from 'components/Avatar';
import {
  useNetworkContext,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import {formatTokenAmount} from 'utils/Utils';
import {useApplicationContext} from 'contexts/ApplicationContext';

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
  selectMode,
}: TokenSelectorProps) {
  const {currentBlockchain} = useBridgeSDK();
  const assetList = useAssets(currentBlockchain);
  const tokenInfoContext = useTokenInfoContext();
  const textInputRef = useRef() as RefObject<TextInput>;
  const [assets, setAssets] = useState<[string, Asset][]>([]);
  const {getTokenSymbolOnNetwork} = useGetTokenSymbolOnNetwork();
  const network = useNetworkContext()?.network;
  const {addresses} = useWalletStateContext();
  const theme = useApplicationContext().theme;

  const balances = useGetTokenBalances(
    currentBlockchain,
    assetList,
    currentBlockchain === Blockchain.AVALANCHE
      ? getAvalancheProvider(network)
      : getEthereumProvider(network),
    true,
    addresses?.addrC,
  );

  useEffect(() => {
    if (!assetList) {
      setAssets([]);
      return;
    }

    let pmAssets: Record<string, Asset>;

    // if (selectMode === SelectTokenMode.CONVERT) {
    //   const convertableAssets: Record<string, Asset> = {};
    //
    //   for (const name in assetList) {
    //     const asset = assetList[name];
    //     if (
    //       asset.assetType === AssetType.ERC20 &&
    //       asset.deprecatedTokenContractAddress
    //     ) {
    //       convertableAssets[name] = asset;
    //     }
    //   }
    //
    //   pmAssets = convertableAssets;
    // } else {
    //   pmAssets = {...assetList};
    // }

    // order
    const assetsInOrder = Object.entries(assetList).sort(
      ([symbol1], [symbol2]) => {
        return (
          balances?.[symbol2]?.minus(balances?.[symbol1]).toNumber() ||
          symbol1.localeCompare(symbol2)
        );
      },
    );

    setAssets(assetsInOrder);
  }, [assetList]);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 300); //delay is for some weird bug effect when opening select token on swap page
    });
  }, [textInputRef]);

  const renderItem = (item: ListRenderItemInfo<[string, Asset]>) => {
    const asset = item.item;
    const name = asset[0];

    const tokenSymbol = getTokenSymbolOnNetwork(name, currentBlockchain);
    const tokenLogo = () => {
      let logoUrl = '';
      if (tokenInfoContext && name) {
        logoUrl = tokenInfoContext[name]?.logo;
      }
      return <Avatar.Custom name={name} symbol={name} logoUri={logoUrl} />;
    };

    const balance = balances?.[name];

    console.log('asset balance in selector: ' + balances?.[name]);

    return (
      <AvaListItem.Base
        title={name}
        leftComponent={tokenLogo()}
        rightComponent={
          balance ? (
            <>
              <AvaText.Body1>
                {formatTokenAmount(balances?.[name] || null, 6)} {tokenSymbol}
              </AvaText.Body1>
            </>
          ) : (
            <ActivityIndicator size={'small'} color={theme.accentColor} />
          )
        }
        onPress={() => {
          onTokenSelected(name);
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

  return (
    <View style={{flex: 1, marginHorizontal: horizontalMargin}}>
      {/*<SearchBar onTextChanged={handleSearch} searchText={searchText} />*/}
      <Space y={16} />
      {!assetList ? (
        <Loader />
      ) : (
        <FlatList
          keyboardShouldPersistTaps="handled"
          data={assets}
          renderItem={renderItem}
          refreshing={false}
          keyExtractor={(item: [string, Asset], index) => item[0] + index}
        />
      )}
    </View>
  );
}

export default TokenSelector;
