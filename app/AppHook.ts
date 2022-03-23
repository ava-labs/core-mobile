import {asyncScheduler, AsyncSubject, concat, Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {BackHandler} from 'react-native';
import BiometricsSDK from 'utils/BiometricsSDK';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Dispatch, useCallback, useState} from 'react';
import {WalletSetupHook} from 'hooks/useWalletSetup';
import {AppNavHook} from 'useAppNav';
import {Repo} from 'Repo';

export type AppHook = {
  onExit: () => Observable<ExitEvents>;
  selectedCurrency: string;
  signOut: () => Promise<void>;
  setSelectedCurrency: Dispatch<string>;
  currencyFormatter(num: number | string, digits?: number): string;
};

export function useApp(
  appNavHook: AppNavHook,
  walletSetupHook: WalletSetupHook,
  repository: Repo,
): AppHook {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  async function signOut() {
    walletSetupHook.destroyWallet();
    await AsyncStorage.clear();
    console.log('cleared async storage');
    await BiometricsSDK.clearWalletKey();
    repository.destroy();
    appNavHook.resetNavToRoot();
  }

  function onExit(): Observable<ExitEvents> {
    const exitPrompt = new AsyncSubject<ExitPromptAnswers>();
    const dialogOp: Observable<ExitFinished> = exitPrompt.pipe(
      map((answer: ExitPromptAnswers) => {
        switch (answer) {
          case ExitPromptAnswers.Cancel:
            return new ExitCanceled();
          case ExitPromptAnswers.Ok:
            return new ExitFinished();
        }
      }),
      map((exitEvent: ExitEvents) => {
        if (exitEvent instanceof ExitFinished) {
          appNavHook.setLoginRoute();
          setTimeout(() => BackHandler.exitApp(), 0);
        }
        return exitEvent;
      }),
    );
    return concat(of(new ShowExitPrompt(exitPrompt)), dialogOp, asyncScheduler);
  }

  /**
   * Localized currency formatter
   */
  const localizedFormatter = useCallback(
    (digits: number) => {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: selectedCurrency,
        maximumFractionDigits: digits,
      });

      return formatter;
    },
    [selectedCurrency],
  );

  /**
   * Used to display format currencies as such
   * values over 1 Million:  $32.2M, $1.6B - USD only
   * values > 0.1 and < 1M: 9,023.03 - 2 or more fraction digits
   * values > -0.1 and < 0.1 : 0.002678 - 6 fraction digits fixed
   * @param num
   * @param digits - default: 2 - fraction digits to be used by large and normal amounts.
   */
  // adapted from: https://stackoverflow.com/a/9462382
  const currencyFormatter = useCallback(
    (num: number | string, digits = 2) => {
      const number = typeof num === 'number' ? num : Number(num);

      const lookup = [
        {value: 1, symbol: ''},
        {value: 1e3, symbol: 'k'},
        {value: 1e6, symbol: 'M'},
        {value: 1e9, symbol: 'B'},
      ];
      const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
      const item = lookup
        .slice()
        .reverse()
        .find(function (item) {
          return number >= item.value;
        });

      // only formatting large numbers. example: $1.32B or $2.1M
      // this may change with UX requirements. Currently anything above
      // Millions will return USD only
      if (item && (item.value === 1e6 || item.value === 1e9)) {
        return (
          '$' +
          (number / item.value).toFixed(digits).replace(rx, '$1') +
          item.symbol
        );
      }

      // everything else gets the localized number format, with 2 digits. or 6 if number is too small
      // example: 2,023.03 (usd) or 0.000321
      const formatter = localizedFormatter(
        number > -0.1 && number < 0.1 ? 6 : digits,
      );

      return formatter.format(number);
    },
    [selectedCurrency],
  );

  return {
    signOut,
    onExit,
    selectedCurrency,
    setSelectedCurrency,
    currencyFormatter,
  };
}

export interface ExitEvents {}

export class ShowExitPrompt implements ExitEvents {
  prompt: AsyncSubject<ExitPromptAnswers>;

  constructor(prompt: AsyncSubject<ExitPromptAnswers>) {
    this.prompt = prompt;
  }
}

export class ExitFinished implements ExitEvents {}

export class ExitCanceled implements ExitEvents {}

export enum ExitPromptAnswers {
  Ok,
  Cancel,
}
