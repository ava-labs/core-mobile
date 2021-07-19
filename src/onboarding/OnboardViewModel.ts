import {asyncScheduler, BehaviorSubject, Observable, timer} from "rxjs"
import {catchError, concatMap, map} from "rxjs/operators"
import BiometricsSDK from "../BiometricsSDK"
import {UserCredentials} from "react-native-keychain"


export default class {

  showButtons: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  promptForWalletLoadingIfExists = (): Observable<WalletLoadingResults> => {
    return timer(100, asyncScheduler).pipe(
      concatMap(value => BiometricsSDK.loadWalletKey(BiometricsSDK.loadOptions)),
      map(value => {
        if (value !== false) {
          const keyOrMnemonic = (value as UserCredentials).password
          if (keyOrMnemonic.startsWith("PrivateKey")) {
            return new PrivateKeyLoaded(keyOrMnemonic)
          } else {
            return new MnemonicLoaded(keyOrMnemonic)
          }
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

export class PrivateKeyLoaded implements WalletLoadingResults {
  privateKey: string

  constructor(privateKey: string) {
    this.privateKey = privateKey
  }
}

export class NothingToLoad implements WalletLoadingResults {
}
