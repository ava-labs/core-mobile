import { asyncScheduler, AsyncSubject, concat, Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import { BackHandler } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { WalletSetupHook } from 'hooks/useWalletSetup'
import { AppNavHook } from 'useAppNav'
import { Repo } from 'Repo'
import { SECURE_ACCESS_SET } from 'resources/Constants'
import AppNavigation from 'navigation/AppNavigation'
import { usePosthogContext } from 'contexts/PosthogContext'
import { useDispatch, useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { onLogOut, setWalletState, WalletState } from 'store/app'
import { resetLoginAttempt } from 'store/security'

export type AppHook = {
  onExit: () => Observable<ExitEvents>
  selectedCurrency: string
  signOut: () => Promise<void>
  currencyFormatter(num: number | string): string
  tokenInCurrencyFormatter(num: number | string): string
}

export function useApp(
  appNavHook: AppNavHook,
  walletSetupHook: WalletSetupHook,
  repository: Repo
): AppHook {
  const dispatch = useDispatch()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const [navigationContainerSet, setNavigationContainerSet] = useState(false)
  const [initRouteSet, setInitRouteSet] = useState(false)
  const { getSetting } = repository.userSettingsRepo
  const { setAnalyticsConsent } = usePosthogContext()

  const signOut = useCallback(async () => {
    walletSetupHook.destroyWallet()
    repository.flush()
    dispatch(onLogOut())
    dispatch(resetLoginAttempt())
    appNavHook.resetNavToRoot()
  }, [appNavHook, dispatch, repository, walletSetupHook])

  useEffect(waitForNavigationContainer, [appNavHook.navigation])
  useEffect(watchCoreAnalyticsFlagFx, [getSetting, setAnalyticsConsent])
  useEffect(decideInitialRoute, [
    appNavHook,
    dispatch,
    initRouteSet,
    navigationContainerSet,
    repository,
    signOut
  ])

  function watchCoreAnalyticsFlagFx() {
    const setting = getSetting('CoreAnalytics') as boolean | undefined
    setAnalyticsConsent(setting)
  }

  function waitForNavigationContainer() {
    async function onFirstLoad() {
      if (!appNavHook.navigation.current) {
        setTimeout(() => onFirstLoad(), 1000)
        return
      }
      setNavigationContainerSet(true)
    }

    onFirstLoad().then()
  }

  function decideInitialRoute() {
    if (!navigationContainerSet || initRouteSet || !repository.initialized) {
      return
    }
    setInitRouteSet(true)
    AsyncStorage.getItem(SECURE_ACCESS_SET).then(result => {
      if (result) {
        if (!repository.userSettingsRepo.getSetting('ConsentToTOU&PP')) {
          //User has probably killed app before consent to TOU, so we'll clear all data and
          //return him to onboarding
          signOut().catch(() => undefined)
        } else {
          dispatch(setWalletState(WalletState.INACTIVE))
          appNavHook.navigation.current?.navigate(AppNavigation.Root.NoWallet)
        }
      } else {
        appNavHook.navigation.current?.navigate(AppNavigation.Root.NoWallet)
      }
    })
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
          appNavHook.resetNavToRoot()
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
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency ?? 'USD',
      currencyDisplay: 'symbol', // the extension uses 'narrowSymbol'
      maximumFractionDigits: 2, // must be set for the `formatToParts` call below
      minimumFractionDigits: 2
    })

    return (amount: number) =>
      formatCurrency(amount, formatter, formatter, selectedCurrency)
  }, [selectedCurrency])

  /**
   * When displaying token value in currency we keep max 8 fraction digits
   */
  const tokenInCurrencyFormatter = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency ?? 'USD',
      currencyDisplay: 'symbol', // the extension uses 'narrowSymbol'
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 // must be set for the `formatToParts` call below
    })
    const smallNumberFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency ?? 'USD',
      currencyDisplay: 'symbol', // the extension uses 'narrowSymbol'
      minimumFractionDigits: 2,
      maximumFractionDigits: 8 // must be set for the `formatToParts` call below
    })

    return (amount: number) =>
      formatCurrency(amount, formatter, smallNumberFormatter, selectedCurrency)
  }, [selectedCurrency])

  /**
   * formatCurrency formats the currency to return:
   *   <symbol><amount>
   *   e.g. $10.00, €10.00
   * If <symbol> matches the currency code (e.g. "CHF 10") then it returns:
   *   <amount> <symbol>
   *   e.g. 10 CHF
   */
  function formatCurrency(
    amount: number,
    bigNumberFormatter: Intl.NumberFormat,
    smallNumberFormatter: Intl.NumberFormat,
    currency: string
  ) {
    const formatter = amount < 1 ? smallNumberFormatter : bigNumberFormatter
    const parts = formatter.formatToParts(amount)
    // match "CHF 10"
    if (parts[0]?.value === currency) {
      const flatArray = parts.map(x => x.value)
      flatArray.push(` ${flatArray.shift() || ''}`)
      return flatArray.join('').trim()
    }
    // match "-CHF 10"
    if (parts[1]?.value === currency) {
      const flatArray = parts.map(x => x.value)
      // remove the currency code after the sign
      flatArray.splice(1, 1)
      flatArray.push(` ${currency}`)
      return flatArray.join('').trim()
    }

    return formatter.format(amount)
  }

  return {
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
