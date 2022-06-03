import {
  ERC20,
  sendErc20Submit,
  SendHookError,
  useSendAvax,
  useSendErc20Form
} from '@avalabs/wallet-react-components'
import { BN, WalletType } from '@avalabs/avalanche-wallet-sdk'
import { Observable } from 'rxjs'
import { TokenWithBalance } from 'store/balance'

// TODO: refactor send logic to deal with multiple chains
export function useSend(
  token: TokenWithBalance | undefined,
  gasPrice$: Observable<{ bn: BN }>
) {
  const isERC20 = token?.contractType === 'ERC-20'
  const sendAvax = useSendAvax(gasPrice$)
  const sendErc20 = useSendErc20Form(
    isERC20 ? (token as ERC20) : undefined,
    gasPrice$
  )

  return (
    !isERC20 ? { ...sendAvax } : { ...sendErc20, submit: sendErc20Submit }
  ) as SendTokenInterface
}

interface SendTokenInterface {
  submit?: (
    token?: TokenWithBalance,
    wall?: Promise<WalletType | undefined> | undefined,
    amount?: BN,
    address?: string,
    gas?: Promise<{
      bn: BN
    }>,
    balances$?: import('rxjs').Subject<{
      [address: string]: TokenWithBalance
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
  setTokenBalances?(tokenBalances: {
    [address: string]: TokenWithBalance
  }): void
  sendFeeDisplayValue?: string | undefined
  token?: TokenWithBalance | undefined
  //endregion
}
