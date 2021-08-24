import React, {FC, useContext, useState} from 'react';
import {
  Animated,
  FlatList,
  ListRenderItemInfo,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import ListItem from './ListItem';
import PortfolioHeader from 'screens/portfolio/PortfolioHeader';
import PortfolioViewModel from 'screens/portfolio/PortfolioViewModel';
import {BehaviorSubject} from 'rxjs';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  wallet: BehaviorSubject<MnemonicWallet>;
  onExit: () => void;
  onSwitchWallet: () => void;
};

const data: JSON[] = require('assets/coins.json');

const PortfolioView: FC<Props> = ({wallet, onExit, onSwitchWallet}) => {
  const [viewModel] = useState(new PortfolioViewModel(wallet));
  const [searchText, setSearchText] = useState('');
  const [scrollY] = useState(new Animated.Value(0));
  const context = useContext(ApplicationContext);
  const isDarkMode = context.isDarkMode;

  const keyExtractor = (item: any, index: number) => item?.id ?? index;

  const renderItem = (item: ListRenderItemInfo<any>) => {
    const json = item.item;
    return (
      <ListItem.Coin
        coinName={json.name}
        coinPrice={json.current_price}
        avaxPrice={json.price_change_percentage_24h}
      />
    );
  };

  return (
    <SafeAreaView style={styles.flex}>
      <FlatList
        style={{
          backgroundColor: isDarkMode ? '#1A1A1C' : '#FFF',
        }}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        nestedScrollEnabled
        ListHeaderComponent={
          <PortfolioHeader
            portfolioViewModel={viewModel}
            searchText={searchText}
            onSearchTextChanged={setSearchText}
          />
        }
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: false},
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexDirection: 'row',
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
