import React from 'react'
import { SwapSlippageDetailsScreen } from 'features/swapV2/screens/SwapSlippageDetailsScreen'
import { useSwapContext } from 'features/swapV2/contexts/SwapContext'

export default (): JSX.Element => {
  const { slippage, setSlippage, autoSlippage, setAutoSlippage, quotes } =
    useSwapContext()

  return (
    <SwapSlippageDetailsScreen
      slippage={slippage}
      setSlippage={setSlippage}
      autoSlippage={autoSlippage}
      setAutoSlippage={setAutoSlippage}
      provider={quotes?.provider}
    />
  )
}
