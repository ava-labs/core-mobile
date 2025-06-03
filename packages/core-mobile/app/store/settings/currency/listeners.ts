import { AnyAction, isAnyOf } from '@reduxjs/toolkit'
import { onAppUnlocked } from 'store/app'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { getLocales } from 'expo-localization'
import {
  selectHasBeenViewedOnce,
  setViewOnce,
  ViewOnceKey
} from 'store/viewOnce'
import { setSelectedCurrency } from './slice'
import { currencies, CurrencySymbol } from './types'

const handleSetDefaultCurrency = (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): void => {
  const locales = getLocales()
  const defaultCurrency = locales[0]?.currencyCode

  const { getState, dispatch } = listenerApi
  const state = getState()

  const hasSetDefaultCurrency = selectHasBeenViewedOnce(
    ViewOnceKey.SET_DEFAULT_CURRENCY
  )(state)

  if (hasSetDefaultCurrency === false) {
    const supportedCurrency =
      currencies.find(curr => curr.symbol === defaultCurrency)?.symbol ??
      CurrencySymbol.USD
    dispatch(setSelectedCurrency(supportedCurrency))
    dispatch(setViewOnce(ViewOnceKey.SET_DEFAULT_CURRENCY))
  }
}

export const addCurrencyListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    matcher: isAnyOf(onAppUnlocked),
    effect: handleSetDefaultCurrency
  })
}
