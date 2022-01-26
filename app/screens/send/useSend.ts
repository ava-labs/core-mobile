import {
  ERC20,
  ERC20WithBalance,
  sendErc20Submit,
  SendHookError,
  TokenWithBalance,
  useSendAvax,
  useSendErc20Form,
} from '@avalabs/wallet-react-components';
import {BehaviorSubject, Observable} from 'rxjs';
import {BN, WalletType} from '@avalabs/avalanche-wallet-sdk';
import {GasPrice} from 'utils/GasPriceHook';

export function useSend(
  token: TokenWithBalance | ERC20WithBalance | undefined,
  gasPrice$: BehaviorSubject<GasPrice>,
) {
  const sendAvax = useSendAvax(gasPrice$);
  const sendErc20 = useSendErc20Form(
    token?.isErc20 ? (token as ERC20WithBalance) : undefined,
    gasPrice$,
  );

  return (
    token?.isAvax ? {...sendAvax} : {...sendErc20, submit: sendErc20Submit}
  ) as SendTokenInterface;
}

interface SendTokenInterface {
  submit?: (
    token?: ERC20,
    wall?: Promise<WalletType | undefined> | undefined,
    amount?: BN,
    address?: string,
    gas?: Promise<{
      bn: BN;
    }>,
    balances$?: import('rxjs').Subject<{
      [address: string]: ERC20;
    }>,
    gasPrice?: BN,
  ) => Observable<
    | {
        error: SendHookError;
        txId?: undefined;
      }
    | {
        error: string;
        txId?: undefined;
      }
    | {
        txId: string;
        error?: undefined;
      }
  >;

  reset(): void;

  setAmount(amount: BN): void;

  setAddress(address: string): void;

  setTokenBalances?(tokenBalances: {[address: string]: ERC20}): void;

  sendFeeDisplayValue?: string | undefined; //erc20
  token?: ERC20 | undefined; //erc20
  maxAmount?: BN | undefined;
  amount?: BN | undefined;
  address?: string | undefined;
  error?: SendHookError | undefined;
  sendFee?: BN | undefined;
  gasPrice?: BN | undefined;
  gasLimit?: number | undefined;
  canSubmit?: boolean | undefined;
}
