import React, {FC, useContext, useRef, useState} from 'react';
import {
  Animated,
  FlatList,
  ListRenderItemInfo,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import AvaListItem from 'screens/portfolio/AvaListItem';
import PortfolioHeader, {
  PORTFOLIO_HEADER_HEIGHT,
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
  const context = useContext(ApplicationContext);
  const isDarkMode = context.isDarkMode;
  const headerHeight = PORTFOLIO_HEADER_HEIGHT;
  const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
  const listRef = useRef<FlatList>(null);

  const keyExtractor = (item: any, index: number) => item?.id ?? index;

  /**
   * Handles animating the header's absolute positioning
   */
  const translateY = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -(headerHeight - 50)],
    extrapolate: 'clamp',
  });

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

  const backgroundColor = isDarkMode ? '#000' : '#F8F8FB';

  return (
    <SafeAreaView style={styles.flex}>
      <StatusBar animated={true} backgroundColor={backgroundColor} />
      <Animated.View
        style={[
          styles.searchHeader,
          {
            transform: [{translateY: translateY}],
            backgroundColor: backgroundColor,
          },
        ]}>
        <PortfolioHeader wallet={wallet} scrollY={scrollY} />
        <SearchHeader
          searchText={searchText}
          onSearchTextChanged={setSearchText}
          listRef={listRef}
        />
      </Animated.View>
      <AnimatedFlatList
        ref={listRef}
        style={{
          backgroundColor: isDarkMode ? '#1A1A1C' : '#FFF',
        }}
        data={data}
        contentContainerStyle={{paddingTop: headerHeight + headerHeight * 0.2}}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        nestedScrollEnabled
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: true},
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F8F8FB',
  },
  container: {
    flexDirection: 'row',
  },
  searchHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 1,
  },
  progressContainer: {flex: 0.1, backgroundColor: '#63a4ff'},
  text: {
    fontSize: 30,
  },
  separator: {
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  touchableTitle: {
    textAlign: 'center',
    color: '#000',
  },
  touchableTitleActive: {
    color: '#fff',
  },
});

export default PortfolioView;
