import { asyncScheduler, AsyncSubject, concat, Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import { BackHandler } from 'react-native'
import BiometricsSDK from 'utils/BiometricsSDK'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Dispatch, useCallback, useEffect, useState } from 'react'
import { WalletSetupHook } from 'hooks/useWalletSetup'
import { AppNavHook } from 'useAppNav'
import { Repo } from 'Repo'
import { SECURE_ACCESS_SET } from 'resources/Constants'
import AppNavigation from 'navigation/AppNavigation'
import { usePosthogContext } from 'contexts/PosthogContext'
import { formatLargeNumber } from 'utils/Utils'

export type AppHook = {
  onExit: () => Observable<ExitEvents>
  selectedCurrency: string
  signOut: () => Promise<void>
  setSelectedCurrency: Dispatch<string>
  currencyFormatter(num: number | string, digits?: number): string
}

export function useApp(
  appNavHook: AppNavHook,
  walletSetupHook: WalletSetupHook,
  repository: Repo
): AppHook {
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [navigationContainerSet, setNavigationContainerSet] = useState(false)
  const [initRouteSet, setInitRouteSet] = useState(false)
  const { getSetting } = repository.userSettingsRepo
  const { setAnalyticsConsent } = usePosthogContext()

  useEffect(waitForNavigationContainer, [])
  useEffect(watchCoreAnalyticsFlagFx, [getSetting, setAnalyticsConsent])
  useEffect(decideInitialRoute, [
    appNavHook,
    initRouteSet,
    navigationContainerSet,
    repository
  ])

  function watchCoreAnalyticsFlagFx() {
    const analyticsConsent = (getSetting('CoreAnalytics') as boolean) ?? false
    setAnalyticsConsent(analyticsConsent)
  }

  function waitForNavigationContainer() {
    async function onFirstLoad() {
      if (!appNavHook.navigation.current) {
        console.log('waiting for navigation container...')
        setTimeout(() => onFirstLoad(), 1000)
        return
      }
      setNavigationContainerSet(true)
      console.log('done.')
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
          appNavHook.setLoginRoute()
        }
      } else {
        appNavHook.navigation.current?.navigate(AppNavigation.Root.Onboard, {
          screen: AppNavigation.Root.Welcome
        })
      }
    })
  }

  async function signOut() {
    walletSetupHook.destroyWallet()
    await AsyncStorage.clear()
    console.log('cleared async storage')
    await BiometricsSDK.clearWalletKey()
    repository.flush()
    appNavHook.resetNavToRoot()
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
          appNavHook.setLoginRoute()
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
  const localizedFormatter = useCallback(
    (digits: number) => {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: selectedCurrency,
        maximumFractionDigits: digits
      })

      return formatter
    },
    [selectedCurrency]
  )

  /**
   * Used to display format currencies as such
   * values over 1 Million:  $32.2M, $1.6B - USD only
   * values > 0.1 and < 1M: 9,023.03 - 2 or more fraction digits
   * values > -0.1 and < 0.1 : 0.002678 - 6 fraction digits fixed
   * @param num
   * @param digits - default: 2 - fraction digits to be used by large and normal amounts.
   */
  const currencyFormatter = useCallback(
    (num: number | string, digits = 2) => {
      let number = typeof num === 'number' ? num : Number(num);

      if (isNaN(number)) {
        number = 0;
      }

      // only formatting large numbers. example: $1.32B or $2.1M
      // this may change with UX requirements. Currently anything above
      // Millions will return USD only
      if (item && (item.value === 1e6 || item.value === 1e9)) {
        const formattedNumber =
          '$' +
          (number / item.value).toFixed(digits).replace(rx, '$1') +
          item.symbol;
        console.log(
          `to be formatted: ${number} - formatted: ${formattedNumber}`,
        );
        return formattedNumber;
      }

      // everything else gets the localized number format, with 2 digits. or 6 if number is too small
      // example: 2,023.03 (usd) or 0.000321
      const formatter = localizedFormatter(
        number > -0.1 && number < 0.1 ? 6 : digits
      )

      const formattedNumber = formatter.format(number);
      console.log(`to be formatted: ${number} - formatted: ${formattedNumber}`);
      return formattedNumber;
    },
    [localizedFormatter]
  )

  return {
    signOut,
    onExit,
    selectedCurrency,
    setSelectedCurrency,
    currencyFormatter
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
