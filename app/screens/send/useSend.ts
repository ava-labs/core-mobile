import {
  ERC20,
  ERC20WithBalance,
  sendErc20Submit,
  SendHookError,
  TokenWithBalance,
  useSendAvax,
  useSendErc20Form
} from '@avalabs/wallet-react-components'
import {BN, WalletType} from '@avalabs/avalanche-wallet-sdk'
import {Observable} from 'rxjs'

export function useSend(
  token: TokenWithBalance | ERC20WithBalance | undefined,
  gasPrice$: Observable<{bn: BN}>
) {
  const sendAvax = useSendAvax(gasPrice$)
  const sendErc20 = useSendErc20Form(
    token?.isErc20 ? (token as ERC20) : undefined,
    gasPrice$
  )

  return (
    token?.isAvax ? {...sendAvax} : {...sendErc20, submit: sendErc20Submit}
  ) as SendTokenInterface
}

interface SendTokenInterface {
  submit?: (
    token?: ERC20,
    wall?: Promise<WalletType | undefined> | undefined,
    amount?: BN,
    address?: string,
    gas?: Promise<{
      bn: BN
    }>,
    balances$?: import('rxjs').Subject<{
      [address: string]: ERC20
    }>,
    gasLimit?: number
  ) => Observable<
    | {
        error: SendHookError
        txId?: undefined
      }
    | {
        error: string
        txId?: undefined
      }
    | {
        txId: string
        error?: undefined
      }
  >
  reset(): void
  setAmount(amount: BN): void
  setAddress(address: string): void
  setGasLimit(gasLimit: number): void
  maxAmount?: BN | undefined
  amount?: BN | undefined
  address?: string | undefined
  error?: SendHookError | undefined
  sendFee?: BN | undefined
  gasPrice?: BN | undefined
  gasLimit?: number | undefined
  canSubmit?: boolean | undefined
  //region ERC20 specific
  setTokenBalances?(tokenBalances: {[address: string]: ERC20}): void
  sendFeeDisplayValue?: string | undefined
  token?: ERC20 | undefined
  //endregion
}
