import { Network } from '@avalabs/core-chains-sdk'
import {
  Avalanche,
  BitcoinProvider,
  JsonRpcBatchInternal
} from '@avalabs/core-wallets-sdk'
import {
  NetworkTokenWithBalance,
  TokenWithBalanceAVM,
  TokenWithBalanceBTC,
  TokenWithBalancePVM
} from '@avalabs/vm-module-types'
import { Account } from 'store/account'

export enum SendErrorMessage {
  AMOUNT_REQUIRED = 'Amount required',
  ADDRESS_REQUIRED = 'Address required',
  INVALID_ADDRESS = 'Address is invalid',
  INVALID_NETWORK_FEE = 'Network Fee is invalid',
  BALANCE_NOT_FOUND = 'Unable to fetch balance.',
  INSUFFICIENT_BALANCE = 'Insufficient balance.',
  INSUFFICIENT_BALANCE_FOR_FEE = 'Insufficient balance for fee.',
  TOKEN_REQUIRED = 'Token is required',
  UNSUPPORTED_TOKEN = 'Unsupported token',
  INVALID_GAS_LIMIT = 'Unable to send token, invalid gas limit.',
  UNKNOWN_ERROR = 'Unknown error'
}

type CommonAdapterOptions<Provider, Token> = {
  fromAddress: string
  provider: Provider
  maxFee: bigint
  nativeToken: Token
}

export type AdapterOptionsEVM = {
  chainId: number
}

export type AdapterOptionsBTC = {
  isMainnet: boolean
}

export type AvmCapableAccount = EnsureDefined<
  Account,
  'addressAVM' | 'addressCoreEth'
>

export type PvmCapableAccount = EnsureDefined<
  Account,
  'addressPVM' | 'addressCoreEth'
>

export type AdapterOptionsP = {
  network: Network
  account: PvmCapableAccount
}

export type AdapterOptionsX = {
  network: Network
  account: AvmCapableAccount
}

type SendAdapter<
  Provider = unknown,
  CustomOptions = unknown,
  Token = NetworkTokenWithBalance
> = (options: CommonAdapterOptions<Provider, Token> & CustomOptions) => {
  send(): Promise<string>
}

export type SendAdapterEVM = SendAdapter<
  JsonRpcBatchInternal,
  AdapterOptionsEVM,
  NetworkTokenWithBalance
>

export type SendAdapterBTC = SendAdapter<
  BitcoinProvider,
  AdapterOptionsBTC,
  TokenWithBalanceBTC
>

export type SendAdapterPVM = SendAdapter<
  Avalanche.JsonRpcProvider,
  AdapterOptionsP,
  TokenWithBalancePVM
>

export type SendAdapterAVM = SendAdapter<
  Avalanche.JsonRpcProvider,
  AdapterOptionsX,
  TokenWithBalanceAVM
>

// A helper generic that turns only given keys (K) of type T
// from optional to required.
export type EnsureDefined<T, K extends keyof T> = T & Required<Pick<T, K>>
