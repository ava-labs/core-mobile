import {BehaviorSubject, Observable, zip} from "rxjs"
import {map, take, tap} from "rxjs/operators"

const NUMBER_OF_WORDS_TO_TYPE = 4

export default class {

  private mnemonic!: BehaviorSubject<string>
  private randomIndices!: BehaviorSubject<number[]>
  enteredMnemonic: BehaviorSubject<Map<number, string>> = new BehaviorSubject(new Map())
  enabledInputs!: Observable<Map<number, boolean>>

  constructor(mnemonic: string) {
    this.mnemonic = new BehaviorSubject<string>(mnemonic)

    this.randomIndices = new BehaviorSubject<number[]>(this.getRandomIndices())

    this.enabledInputs = zip(this.mnemonic, this.randomIndices).pipe(
      map(([mnemonic, randomIndices]) => {
        const enabledInputs: Map<number, boolean> = new Map()
        mnemonic.split(" ").forEach((value: string, index: number) => {
          let enabled = randomIndices.indexOf(index) !== -1
          enabledInputs.set(index, enabled)
        })
        return enabledInputs
      })
    )
  }

  onComponentMount = () => {
    this.generateMnemonics()
  }

  private generateMnemonics = () => {
    zip(this.mnemonic, this.randomIndices).pipe(
      take(1),
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
  }

  private getRandomIndices(): number[] {
    const randomIndices: number[] = []
    for (let i = 0; i < NUMBER_OF_WORDS_TO_TYPE; i++) {
      randomIndices.push(Math.trunc(Math.random() * 24))
    }
    return randomIndices
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
        return true
      }),
    )
  }

  setMnemonic(key: number, value: string) {
    const next = new Map(this.enteredMnemonic.value.set(key, value))
    this.enteredMnemonic.next(next)
  }
}
