import React, {useRef} from 'react';
import {FlatList, ListRenderItemInfo, StyleSheet} from 'react-native';
import AvaListItem from 'screens/portfolio/AvaListItem';
import PortfolioHeader from 'screens/portfolio/PortfolioHeader';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AvaNavigation from 'navigation/AvaNavigation';

// type PortfolioProps = {
//   onExit: () => void;
//   onSwitchWallet: () => void;
// };

const data: JSON[] = require('assets/coins.json');
export const keyExtractor = (item: any, index: number) => item?.id ?? index;

function PortfolioView() {
  const listRef = useRef<FlatList>(null);
  const {navigate} = useNavigation();

  function showBottomSheet(symbol: string) {
    // navigate(AvaNavigation.Modal.SendReceiveBottomSheet, {symbol});
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
    <SafeAreaView style={styles.flex}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});

export default PortfolioView;
