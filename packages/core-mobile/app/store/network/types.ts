import { Network } from '@avalabs/core-chains-sdk'

export type ChainID = number

export type NetworkWithCaip2ChainId = Network & { caip2ChainId?: string }

export type Networks = { [chainId: ChainID]: NetworkWithCaip2ChainId }

export type NetworkState = {
  customNetworks: Networks
  enabledChainIds: ChainID[]
  disabledLastTransactedChainIds: ChainID[]
  active: ChainID
}

export enum TokenSymbol {
  AAVE = 'AAVE',
  ADA = 'ADA',
  APT = 'APT',
  ARB = 'ARB',
  ATOM = 'ATOM',
  AVAX = 'AVAX',
  BCH = 'BCH',
  BNB = 'BNB',
  BTC = 'BTC',
  DAI = 'DAI',
  DOGE = 'DOGE',
  DOT = 'DOT',
  ETH = 'ETH',
  FIL = 'FIL',
  FLOW = 'FLOW',
  GRT = 'GRT',
  HBAR = 'HBAR',
  ICP = 'ICP',
  IMX = 'IMX',
  LDO = 'LDO',
  LEO = 'LEO',
  LINK = 'LINK',
  MATIC = 'MATIC',
  NEAR = 'NEAR',
  OKB = 'OKB',
  ONDO = 'ONDO',
  QNT = 'QNT',
  SAVAX = 'SAVAX',
  WAVAX = 'WAVAX',
  SHIB = 'SHIB',
  SOL = 'SOL',
  STX = 'STX',
  SUI = 'SUI',
  TON = 'TON',
  TRX = 'TRX',
  UNI = 'UNI',
  USDC = 'USDC',
  USDT = 'USDT',
  VET = 'VET',
  XLM = 'XLM',
  XRP = 'XRP'
}
