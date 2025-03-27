import React from 'react'
import { Icons } from '@avalabs/k2-alpine'
import { SvgProps } from 'react-native-svg'
import { CurrencySymbol } from 'store/settings/currency'

const DEFAULT_SIZE = 36

export const CurrencyIcon = ({
  symbol,
  size = DEFAULT_SIZE
}: {
  symbol: CurrencySymbol
  size?: number
}): React.JSX.Element => {
  const Icon = CURRENCY_SYMBOL_TO_ICON[symbol]
  return Icon && <Icon testID={`icon__${symbol}`} width={size} height={size} />
}

const CURRENCY_SYMBOL_TO_ICON: Record<CurrencySymbol, React.FC<SvgProps>> = {
  AED: Icons.Currencies.AED,
  ARS: Icons.Currencies.ARS,
  AUD: Icons.Currencies.AUD,
  BRL: Icons.Currencies.BRL,
  BDT: Icons.Currencies.BDT,
  BGN: Icons.Currencies.BGN,
  CAD: Icons.Currencies.CAD,
  CHF: Icons.Currencies.CHF,
  COP: Icons.Currencies.COP,
  CLP: Icons.Currencies.CLP,
  CNY: Icons.Currencies.CNY,
  CZK: Icons.Currencies.CZK,
  DKK: Icons.Currencies.DKK,
  EUR: Icons.Currencies.EUR,
  EGP: Icons.Currencies.EGP,
  GBP: Icons.Currencies.GBP,
  HKD: Icons.Currencies.HKD,
  HUF: Icons.Currencies.HUF,
  IDR: Icons.Currencies.IDR,
  ILS: Icons.Currencies.ILS,
  IRR: Icons.Currencies.IRR,
  INR: Icons.Currencies.INR,
  JPY: Icons.Currencies.JPY,
  KRW: Icons.Currencies.KRW,
  MAD: Icons.Currencies.MAD,
  MXN: Icons.Currencies.MXN,
  MYR: Icons.Currencies.MYR,
  NOK: Icons.Currencies.NOK,
  NGN: Icons.Currencies.NGN,
  NZD: Icons.Currencies.NZD,
  PHP: Icons.Currencies.PHP,
  PKR: Icons.Currencies.PKR,
  PLN: Icons.Currencies.PLN,
  RON: Icons.Currencies.RON,
  RUB: Icons.Currencies.RUB,
  SAR: Icons.Currencies.SAR,
  SEK: Icons.Currencies.SEK,
  SGD: Icons.Currencies.SGD,
  THB: Icons.Currencies.THB,
  TRY: Icons.Currencies.TRY,
  TWD: Icons.Currencies.TWD,
  USD: Icons.Currencies.USD,
  VND: Icons.Currencies.VND,
  ZAR: Icons.Currencies.ZAR
}
