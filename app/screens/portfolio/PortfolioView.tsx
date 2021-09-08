import React, {FC, useContext, useRef} from 'react';
import {FlatList, ListRenderItemInfo, StyleSheet} from 'react-native';
import AvaListItem from 'screens/portfolio/AvaListItem';
import PortfolioHeader from 'screens/portfolio/PortfolioHeader';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {SafeAreaProvider} from 'react-native-safe-area-context';

type PortfolioProps = {
  onExit: () => void;
  onSwitchWallet: () => void;
};

const data: JSON[] = require('assets/coins.json');
export const keyExtractor = (item: any, index: number) => item?.id ?? index;

const PortfolioView: FC<PortfolioProps> = ({onExit, onSwitchWallet}) => {
  const listRef = useRef<FlatList>(null);
  const context = useContext(ApplicationContext);

  const renderItem = (item: ListRenderItemInfo<any>) => {
    const json = item.item;
    return (
      <AvaListItem.Token
        tokenName={json.name}
        tokenPrice={json.current_price}
        image={json.image}
        symbol={json.symbol}
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
            backgroundColor: context.theme.bgOnBgApp,
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
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F8F8FB',
  },
});

export default PortfolioView;
