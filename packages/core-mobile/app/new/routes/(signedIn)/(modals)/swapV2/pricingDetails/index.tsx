import React from 'react'
import { SwapPricingDetailsScreen } from 'features/swapV2/screens/SwapPricingDetailsScreen'
import {
  useManuallySelected,
  useQuotes,
  useSwapSelectedFromToken,
  useSwapSelectedToToken
} from 'features/swapV2/store'

export default (): JSX.Element => {
  const [fromToken] = useSwapSelectedFromToken()
  const [toToken] = useSwapSelectedToToken()
  const [quotes, setQuotes] = useQuotes()
  const [manuallySelected, setManuallySelected] = useManuallySelected()

  return (
    <SwapPricingDetailsScreen
      fromToken={fromToken}
      toToken={toToken}
      quotes={quotes}
      setQuotes={setQuotes}
      manuallySelected={manuallySelected}
      setManuallySelected={setManuallySelected}
    />
  )
}
