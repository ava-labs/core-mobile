import React, {FC, useCallback} from 'react';
import {FlatList, ListRenderItemInfo, StyleSheet} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import CurrencyListItem from 'screens/drawer/currency-selector/CurrencyListItem';
import {currencies} from '@avalabs/wallet-react-components';
import {DrawerStackParamList} from 'navigation/DrawerNavigator';

type CurrencyRouteProp = RouteProp<DrawerStackParamList, 'CurrencySelector'>;

const CurrencySelector: FC = () => {
  const {goBack} = useNavigation();
  const route = useRoute<CurrencyRouteProp>();
  const selectedCurrency = route?.params?.selectedCurrency;

  const handlePress = useCallback((code: string) => {
    route?.params?.onCurrencySelected(code);
    goBack();
  }, []);

  const renderItem = (
    item: ListRenderItemInfo<{name: string; symbol: string}>,
  ) => {
    const currency = item.item;

    return (
      <CurrencyListItem
        name={`${currency.name} (${currency.symbol})`}
        selected={selectedCurrency === currency.symbol}
        onPress={() => handlePress(currency.symbol)}
      />
    );
  };

  return (
    <SafeAreaProvider style={styles.flex}>
      <FlatList
        style={styles.tokenList}
        data={currencies}
        renderItem={renderItem}
        keyExtractor={(item: any) => item.name}
        scrollEventThrottle={16}
      />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  tokenList: {
    flex: 1,
    marginTop: 8,
  },
});

export default CurrencySelector;
