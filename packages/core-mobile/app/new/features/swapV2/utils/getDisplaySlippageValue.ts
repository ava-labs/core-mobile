export const getDisplaySlippageValue = ({
  autoSlippage,
  quoteSlippageBps,
  manualSlippage
}: {
  autoSlippage: boolean
  quoteSlippageBps?: number
  manualSlippage: number
}): string => {
  // When auto slippage is ON and a quote is available → displays the quote's actual slippageBps
  if (autoSlippage && quoteSlippageBps) {
    return `Auto • ${quoteSlippageBps / 100}%`
  }

  // When auto slippage is ON but no quote yet → displays "Auto" without percentage
  if (autoSlippage) {
    return 'Auto'
  }

  // When auto slippage is OFF → displays manual slippage setting
  return `${manualSlippage}%`
}
