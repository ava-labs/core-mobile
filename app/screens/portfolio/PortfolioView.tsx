import React, {FC, useContext, useRef, useState} from 'react';
import {
  Animated,
  FlatList,
  ListRenderItemInfo,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import AvaListItem from 'screens/portfolio/AvaListItem';
import PortfolioHeader, {
  HEADER_MAX_HEIGHT,
  HEADER_MIN_HEIGHT,
} from 'screens/portfolio/PortfolioHeader';
import {ApplicationContext} from 'contexts/ApplicationContext';
import SearchHeader from 'screens/portfolio/components/SearchHeader';

type Props = {
  wallet: MnemonicWallet;
  onExit: () => void;
  onSwitchWallet: () => void;
};

const data: JSON[] = require('assets/coins.json');

const PortfolioView: FC<Props> = ({wallet, onExit, onSwitchWallet}) => {
  const [searchText, setSearchText] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList>(null);
  const context = useContext(ApplicationContext);
  const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

  const keyExtractor = (item: any, index: number) => item?.id ?? index;

  const renderItem = (item: ListRenderItemInfo<any>) => {
    const json = item.item;
    return (
      <AvaListItem.Coin
        coinName={json.name}
        coinPrice={json.current_price}
        avaxPrice={json.price_change_percentage_24h}
      />
    );
  };

  return (
    <SafeAreaView style={styles.flex}>
      <AnimatedFlatList
        ref={listRef}
        style={[
          {
            flex: 1,
            backgroundColor: context.theme.cardBg,
            marginTop: HEADER_MIN_HEIGHT,
          },
        ]}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEventThrottle={16}
        stickyHeaderIndices={[0]}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: true},
        )}
        contentContainerStyle={{
          paddingTop: HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT,
        }}
        ListHeaderComponent={
          <SearchHeader
            searchText={searchText}
            onSearchTextChanged={setSearchText}
            listRef={listRef}
          />
        }
      />
      <PortfolioHeader wallet={wallet} scrollY={scrollY} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F8F8FB',
  },
});

export default PortfolioView;
