import {asyncScheduler, BehaviorSubject, Observable, timer} from "rxjs"
import {catchError, concatMap, map} from "rxjs/operators"
import BiometricsSDK from "../BiometricsSDK"
import {UserCredentials} from "react-native-keychain"


export default class {

  showButtons: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  promptForWalletLoadingIfExists = (): Observable<WalletLoadingResults> => {
    return timer(100, asyncScheduler).pipe(
      concatMap(value => BiometricsSDK.loadMnemonic(BiometricsSDK.loadOptions)),
      map(value => {
        if (value !== false) {
          const mnemonic = (value as UserCredentials).password
          return new MnemonicLoaded(mnemonic)
        } else {
          this.showButtons.next(true)
          return new NothingToLoad()
        }
      }),
      catchError(err => {
        this.showButtons.next(true)
        throw err
      })
    )
  }
}

export interface WalletLoadingResults {
}

export class MnemonicLoaded implements WalletLoadingResults {
  mnemonic: string

  constructor(mnemonic: string) {
    this.mnemonic = mnemonic
  }
}

export class NothingToLoad implements WalletLoadingResults {
}
