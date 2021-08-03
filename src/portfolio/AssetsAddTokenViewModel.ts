import {BehaviorSubject, from, Observable, of} from 'rxjs';
import {catchError, concatMap, map, skip, tap} from 'rxjs/operators';
import {Assets, MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import Erc20Token from "@avalabs/avalanche-wallet-sdk/dist/Asset/Erc20Token"


export default class {
  private wallet!: BehaviorSubject<MnemonicWallet>
  private token: Observable<Erc20Token | null>
  tokenContractAddress: BehaviorSubject<string> = new BehaviorSubject("0x")
  // tokenContractAddress: BehaviorSubject<string> = new BehaviorSubject("0xd00ae08403B9bbb9124bB305C09058E32C39A48c") //for testing
  tokenName: Observable<string>
  tokenSymbol: Observable<string>
  tokenDecimals: Observable<string>
  errorMsg: BehaviorSubject<string> = new BehaviorSubject("")
  addTokenBtnDisabled: Observable<boolean>

  constructor(wallet: BehaviorSubject<MnemonicWallet>) {
    this.wallet = wallet

    this.token = this.tokenContractAddress.pipe(
      skip(1), //so that it doesn't show error msg until user starts typing something
      tap(() => this.errorMsg.next("")),
      concatMap(address => from(Assets.getErc20Token(address)).pipe(
        catchError(err => {
          this.errorMsg.next("Invalid contract address.")
          return of(null)
        })
      )),
    )

    this.tokenName = this.token.pipe(
      map(token => token?.name || "")
    )
    this.tokenSymbol = this.token.pipe(
      map(token => token?.symbol || "")
    )
    this.tokenDecimals = this.token.pipe(
      map(token => token?.decimals.toString() || "")
    )
    this.addTokenBtnDisabled = this.token.pipe(
      map(token => token === null)
    )
  }

  setAddress = (address: string): void => {
    this.tokenContractAddress.next(address)
  }

  onAddToken = (): Observable<boolean> => {
    return from(Assets.getErc20Token(this.tokenContractAddress.value)).pipe(
      map(() => true)
    )
  }
}
