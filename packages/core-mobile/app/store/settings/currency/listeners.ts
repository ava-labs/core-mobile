import { AnyAction } from '@reduxjs/toolkit'
import { onLogIn } from 'store/app'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { getLocales } from 'expo-localization'
import { setSelectedCurrency } from './slice'
import { currencies, CurrencySymbol } from './types'

const handleSetDefaultCurrency = (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): void => {
  const locales = getLocales()
  const defaultCurrency = locales[0]?.currencyCode

  const { dispatch } = listenerApi

  const supportedCurrency =
    currencies.find(curr => curr.symbol === defaultCurrency)?.symbol ??
    CurrencySymbol.USD
  dispatch(setSelectedCurrency(supportedCurrency))
}

export const addCurrencyListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: onLogIn,
    effect: handleSetDefaultCurrency
  })
}
