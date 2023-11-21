import { asyncScheduler, AsyncSubject, concat, Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
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
import { resetNavToRoot } from 'utils/Navigation'

export type AppHook = {
  onExit: () => Observable<ExitEvents>
  selectedCurrency: string
  deleteWallet: () => void
  signOut: () => void
  currencyFormatter(num: number | string, notation?: NotationTypes): string
  tokenInCurrencyFormatter(num: number | string): string
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
    resetNavToRoot()
  }, [deleteWallet])

  useEffect(watchCoreAnalyticsFlagFx, [
    coreAnalyticsConsentSetting,
    setAnalyticsConsent
  ])

  function watchCoreAnalyticsFlagFx(): void {
    setAnalyticsConsent(coreAnalyticsConsentSetting)
  }

  function onExit(): Observable<ExitEvents> {
    const exitPrompt = new AsyncSubject<ExitPromptAnswers>()
    const dialogOp: Observable<ExitFinished> = exitPrompt.pipe(
      map((answer: ExitPromptAnswers) => {
        switch (answer) {
          case ExitPromptAnswers.Cancel:
            return new ExitCanceled()
          case ExitPromptAnswers.Ok:
            return new ExitFinished()
        }
      }),
      map((exitEvent: ExitEvents) => {
        if (exitEvent instanceof ExitFinished) {
          resetNavToRoot()
          setTimeout(() => BackHandler.exitApp(), 0)
        }
        return exitEvent
      })
    )
    return concat(of(new ShowExitPrompt(exitPrompt)), dialogOp, asyncScheduler)
  }

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

  return {
    deleteWallet,
    signOut,
    onExit,
    selectedCurrency,
    currencyFormatter,
    tokenInCurrencyFormatter
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExitEvents {}

export class ShowExitPrompt implements ExitEvents {
  prompt: AsyncSubject<ExitPromptAnswers>

  constructor(prompt: AsyncSubject<ExitPromptAnswers>) {
    this.prompt = prompt
  }
}

export class ExitFinished implements ExitEvents {}

export class ExitCanceled implements ExitEvents {}

export enum ExitPromptAnswers {
  Ok,
  Cancel
}
