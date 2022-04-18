import React from 'react'
import { FlatList, ListRenderItemInfo, StyleSheet } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import CurrencyListItem from 'screens/drawer/currency-selector/CurrencyListItem'
import { currencies } from '@avalabs/wallet-react-components'
import { useApplicationContext } from 'contexts/ApplicationContext'

const CurrencySelector = ({
  onSelectedCurrency
}: {
  onSelectedCurrency: (code: string) => void
}) => {
  const { selectedCurrency } = useApplicationContext().appHook
  const renderItem = (
    item: ListRenderItemInfo<{ name: string; symbol: string }>
  ) => {
    const currency = item.item

    return (
      <CurrencyListItem
        name={`${currency.name} (${currency.symbol})`}
        selected={selectedCurrency === currency.symbol}
        onPress={() => onSelectedCurrency(currency.symbol)}
      />
    )
  }

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
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  tokenList: {
    flex: 1,
    marginTop: 8
  }
})

export default CurrencySelector
