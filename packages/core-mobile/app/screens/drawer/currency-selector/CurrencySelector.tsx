import React from 'react'
import {
  FlatList,
  InteractionManager,
  ListRenderItemInfo,
  StyleSheet
} from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import CurrencyListItem from 'screens/drawer/currency-selector/CurrencyListItem'
import { useDispatch, useSelector } from 'react-redux'
import {
  currencies,
  CurrencySymbol,
  selectSelectedCurrency,
  setSelectedCurrency
} from 'store/settings/currency'
import { useNavigation } from '@react-navigation/native'
import AnalyticsService from 'services/analytics/AnalyticsService'

const CurrencySelector = (): JSX.Element => {
  const navigation = useNavigation()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const dispatch = useDispatch()

  const renderItem = (
    item: ListRenderItemInfo<{ name: string; symbol: CurrencySymbol }>
  ): JSX.Element => {
    const currency = item.item

    const handleOnCurrencyChanged = (): void => {
      if (
        currency.symbol.toLocaleUpperCase() !==
        selectedCurrency.toLocaleUpperCase()
      ) {
        AnalyticsService.capture('CurrencySettingChanged', {
          currency: currency.symbol.toLocaleUpperCase()
        })
      }
    }

    const onPress = (): void => {
      handleOnCurrencyChanged()
      dispatch(setSelectedCurrency(currency.symbol))
      InteractionManager.runAfterInteractions(() => {
        navigation.goBack()
      })
    }

    return (
      <CurrencyListItem
        name={`${currency.name} (${currency.symbol})`}
        selected={selectedCurrency === currency.symbol}
        onPress={onPress}
      />
    )
  }

  return (
    <SafeAreaProvider style={styles.flex}>
      <FlatList
        style={styles.tokenList}
        data={currencies}
        renderItem={renderItem}
        keyExtractor={item => item.name}
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
