import React, { useCallback, useState } from 'react'
import { ScrollScreen } from 'common/components/ScrollScreen'
import {
  ActivityIndicator,
  Button,
  SendTokenUnitInputWidget,
  View
} from '@avalabs/k2-alpine'
import { TokenUnit } from '@avalabs/core-utils-sdk/dist'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'

export const SelectAmountFormBase = ({
  title = 'How much do you want to deposit?',
  token,
  tokenBalance,
  maxAmount,
  validateAmount,
  submit,
  onSubmitted
}: {
  title?: string
  token: {
    decimals: number
    symbol: string
  }
  tokenBalance: TokenUnit
  maxAmount: TokenUnit | undefined
  validateAmount: (amount: TokenUnit) => Promise<void>
  submit: ({ amount }: { amount: TokenUnit }) => Promise<string>
  onSubmitted: (params: { txHash: string; amount: TokenUnit }) => void
}): JSX.Element => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amount, setAmount] = useState<TokenUnit>()
  const { getMarketTokenBySymbol } = useWatchlist()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const formatInCurrency = useCallback(
    (amt: TokenUnit, symbol: string): string => {
      const currentPrice = getMarketTokenBySymbol(symbol)?.currentPrice ?? 0
      return amt.mul(currentPrice).toDisplay() + ' ' + selectedCurrency
    },
    [getMarketTokenBySymbol, selectedCurrency]
  )

  const handleSubmit = useCallback(async () => {
    if (!amount) {
      return
    }

    try {
      setIsSubmitting(true)
      const txHash = await submit({ amount })
      onSubmitted({ txHash, amount })
    } finally {
      setIsSubmitting(false)
    }
  }, [amount, submit, onSubmitted])

  const canSubmit =
    !isSubmitting &&
    amount &&
    amount.gt(0) &&
    tokenBalance &&
    (amount.lt(tokenBalance) || amount?.eq(tokenBalance))

  const renderFooter = useCallback(() => {
    return (
      <Button
        size="large"
        type="primary"
        onPress={handleSubmit}
        disabled={!canSubmit}>
        {isSubmitting ? <ActivityIndicator size="small" /> : 'Next'}
      </Button>
    )
  }, [handleSubmit, isSubmitting, canSubmit])

  return (
    <ScrollScreen
      title={title}
      titleSx={{ maxWidth: '80%' }}
      isModal
      contentContainerStyle={{
        padding: 16,
        paddingTop: 0
      }}
      renderFooter={renderFooter}>
      <View sx={{ flex: 1 }}>
        <SendTokenUnitInputWidget
          sx={{ marginTop: 12 }}
          amount={amount}
          token={{
            maxDecimals: token.decimals,
            symbol: token.symbol
          }}
          balance={tokenBalance}
          formatInCurrency={amt => formatInCurrency(amt, token.symbol)}
          onChange={setAmount}
          validateAmount={validateAmount}
          disabled={isSubmitting}
          autoFocus
          presetPercentages={[25, 50]}
          maxAmount={maxAmount}
        />
      </View>
    </ScrollScreen>
  )
}
