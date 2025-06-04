import { AnyAction } from '@reduxjs/toolkit'
import { onAppUnlocked } from 'store/app'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { getLocales } from 'expo-localization'
import {
  selectHasBeenViewedOnce,
  setViewOnce,
  ViewOnceKey
} from 'store/viewOnce'
import { AppDispatch } from '../../types'
import {
  selectSelectedCurrency,
  setCurrencyOnChangeLocale,
  setSelectedCurrency
} from './slice'
import { currencies, CurrencySymbol } from './types'

export const setCurrency = (
  dispatch: AppDispatch,
  selectedCurrency: string
): void => {
  const locales = getLocales()
  const currencyCode = locales[0]?.currencyCode

  const supportedCurrency =
    currencies.find(curr => curr.symbol === currencyCode)?.symbol ??
    CurrencySymbol.USD

  if (selectedCurrency === supportedCurrency) return

  dispatch(setSelectedCurrency(supportedCurrency))
}

const handleSetCurrencyOnChangeLocale = (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): void => {
  const { getState, dispatch } = listenerApi
  const state = getState()
  const selectedCurrency = selectSelectedCurrency(state)
  setCurrency(dispatch, selectedCurrency)
}

const handleSetDefaultCurrency = (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): void => {
  const { getState, dispatch } = listenerApi
  const state = getState()
  const selectedCurrency = selectSelectedCurrency(state)

  const hasSetDefaultCurrency = selectHasBeenViewedOnce(
    ViewOnceKey.SET_DEFAULT_CURRENCY
  )(state)

  if (hasSetDefaultCurrency === false) {
    setCurrency(dispatch, selectedCurrency)
    dispatch(setViewOnce(ViewOnceKey.SET_DEFAULT_CURRENCY))
  }
}

export const addCurrencyListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: onAppUnlocked,
    effect: handleSetDefaultCurrency
  })

  startListening({
    actionCreator: setCurrencyOnChangeLocale,
    effect: handleSetCurrencyOnChangeLocale
  })
}
