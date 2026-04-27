import React from 'react'
import { SwapPricingDetailsScreen } from 'features/swap/screens/SwapPricingDetailsScreen'
import { useSwapContext } from 'features/swap/contexts/SwapContext'

export default (): JSX.Element => {
  const {
    bestQuote,
    selectQuoteById,
    allQuotes,
    userQuote,
    activeQuote,
    fromToken,
    toToken
  } = useSwapContext()

  return (
    <SwapPricingDetailsScreen
      fromToken={fromToken}
      toToken={toToken}
      bestQuote={bestQuote}
      userQuote={userQuote}
      selectedQuote={activeQuote}
      allQuotes={allQuotes}
      selectQuoteById={selectQuoteById}
    />
  )
}
