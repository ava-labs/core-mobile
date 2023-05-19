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
import { formatCurrency } from 'utils/FormatCurrency'

export type AppHook = {
  onExit: () => Observable<ExitEvents>
  selectedCurrency: string
  deleteWallet: () => void
  signOut: () => void
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

  const deleteWallet = useCallback(() => {
    walletSetupHook.destroyWallet()
    repository.flush()
    dispatch(onLogOut())
    dispatch(resetLoginAttempt())
  }, [dispatch, repository, walletSetupHook])

  const signOut = useCallback(() => {
    deleteWallet()
    appNavHook.resetNavToRoot()
  }, [appNavHook, deleteWallet])

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
          signOut()
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
    return (amount: number) => formatCurrency(amount, selectedCurrency, false)
  }, [selectedCurrency])

  /**
   * When displaying token value in currency we keep max 8 fraction digits
   */
  const tokenInCurrencyFormatter = useMemo(() => {
    return (amount: number) => formatCurrency(amount, selectedCurrency, true)
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
