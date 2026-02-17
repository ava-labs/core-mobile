import React from 'react'
import { SwapSlippageDetailsScreen } from 'features/swapV2/screens/SwapSlippageDetailsScreen'
import { useSwapContext } from 'features/swapV2/contexts/SwapContext'

export default (): JSX.Element => {
  const {
    slippage,
    setSlippage,
    autoSlippage,
    setAutoSlippage,
    bestQuote,
    userQuote
  } = useSwapContext()

  // userQuote takes precedence over bestQuote
  const selectedQuote = userQuote ?? bestQuote

  return (
    <SwapSlippageDetailsScreen
      slippage={slippage}
      setSlippage={setSlippage}
      autoSlippage={autoSlippage}
      setAutoSlippage={setAutoSlippage}
      serviceType={selectedQuote?.serviceType}
    />
  )
}
