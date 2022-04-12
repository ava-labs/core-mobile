import React, {RefObject, useEffect, useRef} from 'react';
import {
  InteractionManager,
  ListRenderItemInfo,
  TextInput,
  View,
} from 'react-native';
import {TokenWithBalance} from '@avalabs/wallet-react-components';
import {useSearchableTokenList} from 'screens/portfolio/useSearchableTokenList';
import Loader from 'components/Loader';
import ZeroState from 'components/ZeroState';
import PortfolioListItem from 'screens/portfolio/components/PortfolioListItem';
import {Space} from 'components/Space';
import {getTokenUID} from 'utils/TokenTools';
import SearchBar from 'components/SearchBar';
import {BottomSheetFlatList} from '@gorhom/bottom-sheet';

const DEFAULT_HORIZONTAL_MARGIN = 16;

interface TokenSelectorProps {
  onTokenSelected: (token: TokenWithBalance) => void;
  horizontalMargin?: number;
}

function TokenSelector({
  onTokenSelected,
  horizontalMargin = DEFAULT_HORIZONTAL_MARGIN,
}: TokenSelectorProps) {
  const {filteredTokenList, searchText, setSearchText} =
    useSearchableTokenList(false);
  const textInputRef = useRef() as RefObject<TextInput>;

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 300); //delay is for some weird bug effect when opening select token on swap page
    });
  }, [textInputRef]);

  const renderItem = (item: ListRenderItemInfo<TokenWithBalance>) => {
    const token = item.item;
    return (
      <PortfolioListItem
        tokenName={token.name}
        tokenPrice={token.balanceDisplayValue ?? '0'}
        tokenPriceUsd={token.balanceUsdDisplayValue}
        image={token?.logoURI}
        symbol={token.symbol}
        onPress={() => {
          onTokenSelected(token);
        }}
      />
    );
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  function getNoResultsText() {
    if (
      !filteredTokenList ||
      (filteredTokenList &&
        filteredTokenList?.length === 0 &&
        (!searchText || (searchText && searchText.length === 0)))
    ) {
      return 'You have no tokens to send';
    }
    return undefined;
  }

  return (
    <View style={{flex: 1, marginHorizontal: horizontalMargin}}>
      <SearchBar onTextChanged={handleSearch} searchText={searchText} />
      <Space y={16} />
      {!filteredTokenList ? (
        <Loader />
      ) : (
        <BottomSheetFlatList
          keyboardShouldPersistTaps="handled"
          data={filteredTokenList}
          renderItem={renderItem}
          refreshing={false}
          keyExtractor={(item: TokenWithBalance) => getTokenUID(item)}
          ListEmptyComponent={
            <ZeroState.NoResultsTextual message={getNoResultsText()} />
          }
        />
      )}
    </View>
  );
}

export default TokenSelector;
