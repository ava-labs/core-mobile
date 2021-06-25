import {BehaviorSubject, Observable, of, Subscription, zip} from "rxjs"
import {map, switchMap, take, tap} from "rxjs/operators"
import BiometricsSDK from "../BiometricsSDK"

const NUMBER_OF_WORDS_TO_TYPE = 4

export default class {

  private mnemonic: BehaviorSubject<string> = new BehaviorSubject<string>("")
  private randomIndices!: Observable<number[]>
  enteredMnemonic: BehaviorSubject<Map<number, string>> = new BehaviorSubject(new Map())
  enabledInputs!: Observable<Map<number, boolean>>
  private enteredMnemonicSubscription: Subscription

  constructor(mnemonic: string) {
    this.mnemonic.next(mnemonic)

    this.randomIndices = this.mnemonic.pipe(
      map(() => {
        const randomIndices: number[] = []
        for (let i = 0; i < NUMBER_OF_WORDS_TO_TYPE; i++) {
          randomIndices.push(Math.trunc(Math.random() * 24))
        }
        return randomIndices
      })
    )

    this.enteredMnemonicSubscription = zip(this.mnemonic, this.randomIndices).pipe(
      map(([mnemonic, randomIndices]) => {
        const enteredMnemonic: Map<number, string> = new Map()
        mnemonic.split(" ").forEach((value: string, index: number) => {
          let shouldSkip = randomIndices.indexOf(index) !== -1
          if (shouldSkip) {
            enteredMnemonic.set(index, "")
          } else {
            enteredMnemonic.set(index, value)
          }
        })
        return enteredMnemonic
      }),
      tap(mnemonic => this.enteredMnemonic.next(mnemonic))
    ).subscribe()

    this.enabledInputs = zip(this.mnemonic, this.randomIndices).pipe(
      map(([mnemonic, randomIndices]) => {
        const enabledInputs: Map<number, boolean> = new Map()
        mnemonic.split(" ").forEach((value: string, index: number) => {
          let enabled = randomIndices.indexOf(index) === -1
          enabledInputs.set(index, enabled)
        })
        return enabledInputs
      })
    )
  }

  cleanup(): void {
    this.enteredMnemonicSubscription?.unsubscribe()
  }

  onVerify(): Observable<boolean> {
    return zip(this.mnemonic, this.enteredMnemonic).pipe(
      take(1),
      map(([mnemonic, enteredMnemonic]) => {
        //check if mnemonic and entered mnemonic match
        const isInvalid: boolean = mnemonic.split(" ").some((value: string, index: number) => {
          return value !== enteredMnemonic.get(index)
        })
        if (isInvalid) {
          throw Error("no match")
        }
        return mnemonic
      }),
      switchMap(mnemonic => zip(of(mnemonic), BiometricsSDK.loadMnemonic())),
      switchMap(([mnemonic, credentials]) => {
        if (credentials === false) {
          throw Error("Error authenticating")
        }
        return BiometricsSDK.saveMnemonic(mnemonic)
      }),
      map(value => {
        if (value === false) {
          throw Error("Error saving mnemonic")
        }
        return true
      })
    )
  }

  setMnemonic(key: number, value: string) {
    this.enteredMnemonic.next(this.enteredMnemonic.value.set(key, value))
  }
}
