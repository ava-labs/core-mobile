import React from 'react'
import { SwapPricingDetailsScreen } from 'features/swap/screens/SwapPricingDetailsScreen'
import { useSwapContext } from 'features/swap/contexts/SwapContext'

export default (): JSX.Element => {
  const {
    bestQuote,
    selectQuoteById,
    allQuotes,
    userQuote,
    fromToken,
    toToken
  } = useSwapContext()

  // userQuote takes precedence over bestQuote
  const selectedQuote = userQuote ?? bestQuote

  return (
    <SwapPricingDetailsScreen
      fromToken={fromToken}
      toToken={toToken}
      bestQuote={bestQuote}
      userQuote={userQuote}
      selectedQuote={selectedQuote}
      allQuotes={allQuotes}
      selectQuoteById={selectQuoteById}
    />
  )
}
