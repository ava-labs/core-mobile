import { BackHandler } from 'react-native'
import { useCallback, useEffect, useMemo } from 'react'
import { usePosthogContext } from 'contexts/PosthogContext'
import { useDispatch, useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { onLogOut } from 'store/app'
import { resetLoginAttempt } from 'store/security'
import { formatCurrency } from 'utils/FormatCurrency'
import { selectCoreAnalyticsConsent } from 'store/settings/securityPrivacy'
import { NotationTypes } from 'consts/FormatNumberTypes'
import { useWallet } from 'hooks/useWallet'
import Logger from 'utils/Logger'

export type AppHook = {
  onExit: (
    showExitPrompt: (confirmExit: () => void, cancel: () => void) => void
  ) => void
  selectedCurrency: string
  deleteWallet: () => void
  signOut: () => void
  currencyFormatter(num: number, notation?: NotationTypes): string
  tokenInCurrencyFormatter(num: number): string
}

export function useApp(): AppHook {
  const dispatch = useDispatch()
  const { destroyWallet } = useWallet()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { setAnalyticsConsent } = usePosthogContext()
  const coreAnalyticsConsentSetting = useSelector(selectCoreAnalyticsConsent)

  const deleteWallet = useCallback(() => {
    destroyWallet()
    dispatch(onLogOut())
    dispatch(resetLoginAttempt())
  }, [dispatch, destroyWallet])

  const signOut = useCallback(() => {
    deleteWallet()
  }, [deleteWallet])

  useEffect(watchCoreAnalyticsFlagFx, [
    coreAnalyticsConsentSetting,
    setAnalyticsConsent
  ])

  function watchCoreAnalyticsFlagFx(): void {
    setAnalyticsConsent(coreAnalyticsConsentSetting)
  }

  const onExit = useCallback(
    (showExitPrompt: (confirmExit: () => void, cancel: () => void) => void) => {
      const confirmExitPromise = new Promise<void>((resolve, reject) => {
        showExitPrompt(resolve, reject)
      })
      confirmExitPromise
        .then(() => {
          setTimeout(() => {
            BackHandler.exitApp()
          }, 0)
        })
        .catch(() => {
          Logger.trace('User canceled app exit')
        })
    },
    []
  )

  /**
   * Localized currency formatter
   */
  const currencyFormatter = useMemo(() => {
    return (amount: number, notation?: NotationTypes) => {
      return formatCurrency({
        amount,
        currency: selectedCurrency,
        boostSmallNumberPrecision: false,
        notation
      })
    }
  }, [selectedCurrency])

  /**
   * When displaying token value in currency we keep max 8 fraction digits
   */
  const tokenInCurrencyFormatter = useMemo(() => {
    return (amount: number, notation?: NotationTypes) =>
      formatCurrency({
        amount,
        currency: selectedCurrency,
        boostSmallNumberPrecision: true,
        notation
      })
  }, [selectedCurrency])

  return useMemo(() => {
    return {
      deleteWallet,
      signOut,
      onExit,
      selectedCurrency,
      currencyFormatter,
      tokenInCurrencyFormatter
    }
  }, [
    deleteWallet,
    signOut,
    onExit,
    selectedCurrency,
    currencyFormatter,
    tokenInCurrencyFormatter
  ])
}
