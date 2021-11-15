import React, {FC, useCallback} from 'react';
import {FlatList, ListRenderItemInfo, StyleSheet} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import CurrencyListItem from 'screens/drawer/currency-selector/CurrencyListItem';
import {DrawerStackParamList} from 'screens/mainView/WalletStackScreen';
import currencyList from 'assets/currency.json';

type CurrencyRouteProp = RouteProp<DrawerStackParamList, 'CurrencySelector'>;

const CurrencySelector: FC = () => {
  const {goBack} = useNavigation();
  const route = useRoute<CurrencyRouteProp>();
  const selectedCurrency = route?.params?.selectedCurrency;

  const handlePress = useCallback((code: string) => {
    route?.params?.onCurrencySelected(code);
    goBack();
  }, []);

  const renderItem = (item: ListRenderItemInfo<any>) => {
    const currency = item.item;

    return (
      <CurrencyListItem
        name={`${currency.name} (${currency.code})`}
        selected={selectedCurrency === currency.code}
        onPress={() => handlePress(currency.code)}
      />
    );
  };

  return (
    <SafeAreaProvider style={styles.flex}>
      <FlatList
        style={styles.tokenList}
        data={currencyList}
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
