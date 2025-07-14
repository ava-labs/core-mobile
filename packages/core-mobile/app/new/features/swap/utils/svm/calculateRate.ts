import { LocalTokenWithBalance } from 'store/balance'
import { JupiterQuote } from './schemas'

export const calculateRate = ({
  quote,
  fromToken,
  toToken
}: {
  quote: JupiterQuote
  fromToken: LocalTokenWithBalance
  toToken: LocalTokenWithBalance
}): number => {
  const toTokenDecimals = 'decimals' in toToken ? toToken.decimals : undefined
  const fromTokenDecimals =
    'decimals' in fromToken ? fromToken.decimals : undefined
  if (toTokenDecimals === undefined || fromTokenDecimals === undefined) {
    throw new Error('Token decimals not found')
  }

  const { inAmount, outAmount } = quote
  const realOutValue = parseInt(outAmount, 10) / 10 ** toTokenDecimals
  const realInValue = parseInt(inAmount, 10) / 10 ** fromTokenDecimals
  return realOutValue / realInValue
}
