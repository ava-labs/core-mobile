import { TokenSymbol } from 'store/network'

// this is the list of supported token symbols that we have high definition icons for
const supportedTokenSymbols = [
  TokenSymbol.AAVE,
  TokenSymbol.ADA,
  TokenSymbol.APT,
  TokenSymbol.ARB,
  TokenSymbol.ATOM,
  TokenSymbol.AVAX,
  TokenSymbol.BCH,
  TokenSymbol.BNB,
  TokenSymbol.BTC,
  TokenSymbol.DAI,
  TokenSymbol.DOGE,
  TokenSymbol.DOT,
  TokenSymbol.ETH,
  TokenSymbol.FIL,
  TokenSymbol.FLOW,
  TokenSymbol.GRT,
  TokenSymbol.HBAR,
  TokenSymbol.ICP,
  TokenSymbol.IMX,
  TokenSymbol.LDO,
  TokenSymbol.LEO,
  TokenSymbol.LINK,
  TokenSymbol.MATIC,
  TokenSymbol.NEAR,
  TokenSymbol.OKB,
  TokenSymbol.ONDO,
  TokenSymbol.QNT,
  TokenSymbol.SAVAX,
  TokenSymbol.WAVAX,
  TokenSymbol.SHIB,
  TokenSymbol.SOL,
  TokenSymbol.STX,
  TokenSymbol.SUI,
  TokenSymbol.TON,
  TokenSymbol.TRX,
  TokenSymbol.UNI,
  TokenSymbol.USDC,
  TokenSymbol.USDT,
  TokenSymbol.VET,
  TokenSymbol.XLM,
  TokenSymbol.XRP,
  TokenSymbol.OP,
  TokenSymbol.BASE
]

export const hasLocalTokenLogo = (symbol: string): boolean => {
  return supportedTokenSymbols.includes(symbol?.toUpperCase() as TokenSymbol)
}

const supportedNetworkTokenSymbols = [
  TokenSymbol.AVAX,
  TokenSymbol.BTC,
  TokenSymbol.ETH,
  TokenSymbol.SOL,
  TokenSymbol.BASE,
  TokenSymbol.OP,
  TokenSymbol.BNB,
  TokenSymbol.ARB
]

export const hasLocalNetworkTokenLogo = (symbol: string): boolean => {
  return supportedNetworkTokenSymbols.includes(
    symbol?.toUpperCase() as TokenSymbol
  )
}
