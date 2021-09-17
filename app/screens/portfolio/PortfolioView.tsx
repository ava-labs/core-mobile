import React, {useRef} from 'react';
import {FlatList, ListRenderItemInfo, StyleSheet} from 'react-native';
import AvaListItem from 'screens/portfolio/AvaListItem';
import PortfolioHeader from 'screens/portfolio/PortfolioHeader';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

type PortfolioProps = {
  onExit: () => void;
  onSwitchWallet: () => void;
};

const data: JSON[] = require('assets/coins.json');
export const keyExtractor = (item: any, index: number) => item?.id ?? index;

function PortfolioView({onExit, onSwitchWallet}: PortfolioProps) {
  const listRef = useRef<FlatList>(null);
  const navigation = useNavigation();

  function showBottomSheet(symbol: string) {
    navigation.navigate('SendReceiveBottomSheet', {symbol});
  }

  const renderItem = (item: ListRenderItemInfo<any>) => {
    const json = item.item;
    return (
      <AvaListItem.Token
        tokenName={json.name}
        tokenPrice={json.current_price}
        image={json.image}
        symbol={json.symbol}
        onPress={() => showBottomSheet(json.symbol)}
      />
    );
  };

  return (
    <SafeAreaProvider style={styles.flex}>
      <PortfolioHeader />
      <FlatList
        ref={listRef}
        style={[
          {
            flex: 1,
            marginTop: 36,
          },
        ]}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEventThrottle={16}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});

export default PortfolioView;
