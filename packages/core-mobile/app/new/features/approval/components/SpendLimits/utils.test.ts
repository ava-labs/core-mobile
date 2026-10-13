import { MaxUint256 } from 'ethers'
import { Limit } from 'hooks/useSpendLimits'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { MarketToken } from 'store/watchlist'
import { getSpendLimitAmounts } from './utils'

const AVAX = { currentPrice: 10 } as MarketToken
const ONE_AVAX = 10n ** 18n

const formatTokenInCurrency = ({ amount }: { amount: number }): string =>
  amount.toFixed(2)

const base = {
  limitType: Limit.CUSTOM,
  tokenValue: ONE_AVAX,
  tokenDecimals: 18,
  tokenSymbol: 'AVAX',
  marketToken: AVAX,
  isDeveloperMode: false,
  selectedCurrency: 'USD',
  formatTokenInCurrency
}

describe('getSpendLimitAmounts', () => {
  describe('unlimited approvals', () => {
    it('labels the fiat line "Unlimited <currency>" on mainnet', () => {
      expect(
        getSpendLimitAmounts({ ...base, limitType: Limit.UNLIMITED })
      ).toEqual(['∞', 'Unlimited USD'])
    })

    it('treats a MaxUint256 value as unlimited regardless of limit type', () => {
      expect(
        getSpendLimitAmounts({
          ...base,
          tokenValue: BigInt(MaxUint256.toString())
        })
      ).toEqual(['∞', 'Unlimited USD'])
    })

    it('drops the fiat label in developer mode', () => {
      expect(
        getSpendLimitAmounts({
          ...base,
          limitType: Limit.UNLIMITED,
          isDeveloperMode: true
        })
      ).toEqual(['∞', undefined])
    })

    it('drops the fiat label for a MaxUint256 value in developer mode', () => {
      expect(
        getSpendLimitAmounts({
          ...base,
          tokenValue: BigInt(MaxUint256.toString()),
          isDeveloperMode: true
        })
      ).toEqual(['∞', undefined])
    })
  })

  describe('finite approvals', () => {
    it('prices the amount at the market rate on mainnet', () => {
      expect(getSpendLimitAmounts(base)).toEqual(['1', '10.00 USD'])
    })

    it('shows the token amount only when there is no market token', () => {
      expect(getSpendLimitAmounts({ ...base, marketToken: undefined })).toEqual(
        ['1', undefined]
      )
    })

    it('shows the token amount only when the market token has no price', () => {
      expect(
        getSpendLimitAmounts({
          ...base,
          marketToken: { currentPrice: undefined } as MarketToken
        })
      ).toEqual(['1', undefined])
    })

    it('shows the unknown-amount placeholder when the value is missing', () => {
      expect(getSpendLimitAmounts({ ...base, tokenValue: undefined })).toEqual([
        UNKNOWN_AMOUNT,
        undefined
      ])
    })

    it('shows the unknown-amount placeholder when the symbol is missing', () => {
      expect(getSpendLimitAmounts({ ...base, tokenSymbol: undefined })).toEqual(
        [UNKNOWN_AMOUNT, undefined]
      )
    })
  })
})
