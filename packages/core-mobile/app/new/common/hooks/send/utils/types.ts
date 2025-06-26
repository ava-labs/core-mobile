import { Network } from '@avalabs/core-chains-sdk'
import {
  NetworkTokenWithBalance,
  TokenWithBalanceAVM,
  TokenWithBalanceBTC,
  TokenWithBalancePVM,
  TokenWithBalanceSVM
} from '@avalabs/vm-module-types'
import { Dispatch } from 'react'
import { Account } from 'store/account'

export enum SendErrorMessage {
  AMOUNT_REQUIRED = 'Amount required',
  ADDRESS_REQUIRED = 'Address required',
  INVALID_ADDRESS = 'Address is invalid',
  INVALID_NETWORK_FEE = 'Network Fee is invalid',
  BALANCE_NOT_FOUND = 'Unable to fetch balance',
  INSUFFICIENT_BALANCE = 'Insufficient balance',
  INSUFFICIENT_BALANCE_FOR_FEE = 'Insufficient balance for fee',
  TOKEN_REQUIRED = 'Token is required',
  UNSUPPORTED_TOKEN = 'Unsupported token',
  INVALID_GAS_LIMIT = 'Unable to send token - invalid gas limit',
  UNKNOWN_ERROR = 'Unknown error',
  EXCESSIVE_NETWORK_FEE = 'Selected fee is too high',
  AMOUNT_TO_LOW = 'Amount to send is too low'
}

type CommonAdapterOptions<Token> = {
  fromAddress: string
  maxFee?: bigint
  nativeToken?: Token
  network?: Network
}

export type AdapterOptionsEVM = {
  chainId?: number
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

export type SvmCapableAccount = EnsureDefined<Account, 'addressSVM'>

export type AdapterOptionsP = {
  account: PvmCapableAccount
}

export type AdapterOptionsX = {
  account: AvmCapableAccount
}

export type AdapterOptionsSVM = {
  account: SvmCapableAccount
}

export type SendReturnType = {
  send(): Promise<string>
  estimatedFee?: bigint
  setGasPrice?: Dispatch<bigint>
}

export type CollectibleSendReturnType = Omit<SendReturnType, 'send'> & {
  send(toAddress: string): Promise<string>
}

type SendAdapter<
  CustomOptions = unknown,
  Token = NetworkTokenWithBalance,
  ReturnType = SendReturnType
> = (options: CommonAdapterOptions<Token> & CustomOptions) => ReturnType

export type SendAdapterEVM = SendAdapter<
  AdapterOptionsEVM,
  NetworkTokenWithBalance
>

export type SendAdapterBTC = SendAdapter<AdapterOptionsBTC, TokenWithBalanceBTC>

export type SendAdapterPVM = SendAdapter<AdapterOptionsP, TokenWithBalancePVM>

export type SendAdapterAVM = SendAdapter<AdapterOptionsX, TokenWithBalanceAVM>

export type SendAdapterSVM = SendAdapter<AdapterOptionsSVM, TokenWithBalanceSVM>

export type SendAdapterCollectible = SendAdapter<
  AdapterOptionsEVM,
  NetworkTokenWithBalance,
  CollectibleSendReturnType
>

// A helper generic that turns only given keys (K) of type T
// from optional to required.
export type EnsureDefined<T, K extends keyof T> = T & Required<Pick<T, K>>
