import React from 'react'
import { SwapSlippageDetailsScreen } from 'features/swap/screens/SwapSlippageDetailsScreen'
import { useSwapContext } from 'features/swap/contexts/SwapContext'

export default (): JSX.Element => {
  const { slippage, setSlippage, autoSlippage, setAutoSlippage, activeQuote } =
    useSwapContext()

  return (
    <SwapSlippageDetailsScreen
      slippage={slippage}
      setSlippage={setSlippage}
      autoSlippage={autoSlippage}
      setAutoSlippage={setAutoSlippage}
      serviceType={activeQuote?.serviceType}
      quoteSlippageBps={activeQuote?.slippageBps}
    />
  )
}
