import React from 'react'
import { SwapPricingDetailsScreen } from 'features/swapV2/screens/SwapPricingDetailsScreen'
import {
  useBestQuote,
  useUserQuote,
  useSwapSelectedFromToken,
  useSwapSelectedToToken
} from 'features/swapV2/hooks/useZustandStore'
import { useSwapContext } from 'features/swapV2/contexts/SwapContext'

export default (): JSX.Element => {
  const [fromToken] = useSwapSelectedFromToken()
  const [toToken] = useSwapSelectedToToken()
  const [bestQuote] = useBestQuote()
  const [userQuote] = useUserQuote()
  const { selectQuoteById, allQuotes } = useSwapContext()

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
