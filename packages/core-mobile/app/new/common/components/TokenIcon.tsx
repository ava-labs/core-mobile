import React from 'react'
import { Icons } from '@avalabs/k2-alpine'
import { SvgProps } from 'react-native-svg'
import { TokenSymbol } from 'store/network'

const DEFAULT_SIZE = 32

export const TokenIcon = ({
  symbol,
  size = DEFAULT_SIZE,
  color,
  isNetworkTokenSymbol = false
}: {
  symbol?: string
  size?: number
  color?: string
  isNetworkTokenSymbol?: boolean
}): React.JSX.Element => {
  const Icon = isNetworkTokenSymbol
    ? NETWORK_TOKEN_SYMBOL_TO_ICON[symbol?.toUpperCase() as NetworkTokenSymbols]
    : TOKEN_SYMBOL_TO_ICON[symbol?.toUpperCase() as TokenSymbol]
  return Icon && <Icon color={color} width={size} height={size} />
}

const TOKEN_SYMBOL_TO_ICON: Record<TokenSymbol, React.FC<SvgProps>> = {
  AAVE: Icons.TokenLogos.AAVE,
  ADA: Icons.TokenLogos.ADA,
  APT: Icons.TokenLogos.APT,
  ARB: Icons.TokenLogos.ARB,
  ATOM: Icons.TokenLogos.ATOM,
  AVAX: Icons.TokenLogos.AVAX,
  BCH: Icons.TokenLogos.BCH,
  BNB: Icons.TokenLogos.BNB,
  BTC: Icons.TokenLogos.BTC,
  DAI: Icons.TokenLogos.DAI,
  DOGE: Icons.TokenLogos.DOGE,
  DOT: Icons.TokenLogos.DOT,
  ETH: Icons.TokenLogos.ETH1,
  FIL: Icons.TokenLogos.FIL,
  FLOW: Icons.TokenLogos.FLOW,
  GRT: Icons.TokenLogos.GRT,
  HBAR: Icons.TokenLogos.HBAR,
  ICP: Icons.TokenLogos.ICP,
  IMX: Icons.TokenLogos.IMX,
  LDO: Icons.TokenLogos.LDO,
  LEO: Icons.TokenLogos.LEO,
  LINK: Icons.TokenLogos.LINK,
  MATIC: Icons.TokenLogos.MATIC,
  NEAR: Icons.TokenLogos.NEAR,
  OKB: Icons.TokenLogos.OKB,
  ONDO: Icons.TokenLogos.ONDO,
  QNT: Icons.TokenLogos.QNT,
  SAVAX: Icons.TokenLogos.sAVAX,
  SHIB: Icons.TokenLogos.SHIB,
  SOL: Icons.TokenLogos.SOL,
  STX: Icons.TokenLogos.STX,
  SUI: Icons.TokenLogos.SUI,
  TON: Icons.TokenLogos.TON,
  TRX: Icons.TokenLogos.TRX,
  UNI: Icons.TokenLogos.UNI,
  USDC: Icons.TokenLogos.USDC,
  USDT: Icons.TokenLogos.USDT,
  VET: Icons.TokenLogos.VET,
  XLM: Icons.TokenLogos.XLM,
  XRP: Icons.TokenLogos.XRP,
  WAVAX: Icons.TokenLogos.wAVAX
}

type NetworkTokenSymbols =
  | TokenSymbol.AVAX
  | TokenSymbol.BTC
  | TokenSymbol.ETH
  | TokenSymbol.SOL

export const NETWORK_TOKEN_SYMBOL_TO_ICON: Record<
  NetworkTokenSymbols,
  React.FC<SvgProps>
> = {
  AVAX: Icons.TokenLogos.AVAX,
  BTC: Icons.TokenLogos.BTC,
  ETH: Icons.TokenLogos.ETH,
  SOL: Icons.TokenLogos.SOL
}
