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
  selectCurrencies,
  selectSelectedCurrency,
  setSelectedCurrency
} from 'store/settings/currency'
import { useNavigation, useRoute } from '@react-navigation/native'
import { usePostCapture } from 'hooks/usePosthogCapture'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'

type ScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.CurrencySelector
>

const CurrencySelector = () => {
  const { currencyChangedAnalyticsEventName } =
    useRoute<ScreenProps['route']>().params
  const navigation = useNavigation()
  const currencies = useSelector(selectCurrencies)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const dispatch = useDispatch()
  const { capture } = usePostCapture()

  const renderItem = (
    item: ListRenderItemInfo<{ name: string; symbol: string }>
  ) => {
    const currency = item.item

    const handleOnCurrencyChanged = () => {
      if (
        currency.symbol.toLocaleUpperCase() !==
          selectedCurrency.toLocaleUpperCase() &&
        currencyChangedAnalyticsEventName
      ) {
        capture(currencyChangedAnalyticsEventName, {
          currency: currency.symbol.toLocaleUpperCase()
        })
      }
    }

    const onPress = () => {
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
