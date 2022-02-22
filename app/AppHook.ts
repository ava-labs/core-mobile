import {asyncScheduler, AsyncSubject, concat, Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {BackHandler} from 'react-native';
import BiometricsSDK from 'utils/BiometricsSDK';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Dispatch, useMemo, useState} from 'react';
import {WalletSetupHook} from 'hooks/useWalletSetup';
import {AppNavHook} from 'useAppNav';
import {Repo} from 'Repo';

export type AppHook = {
  onExit: () => Observable<ExitEvents>;
  selectedCurrency: string;
  signOut: () => Promise<void>;
  setSelectedCurrency: Dispatch<string>;
  currencyFormatter(value: number): string;
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

  const currencyFormatter = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
    });

    return formatter.format.bind(formatter);
  }, [selectedCurrency]);

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
