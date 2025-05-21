import { MarketType } from 'store/watchlist'

export const getTokenActions = ({
  marketType,
  isAVAX,
  isZeroBalance,
  isSwapBlocked,
  isTokenSwappable,
  hasEnoughAvax,
  isEarnBlocked
}: {
  marketType: MarketType | undefined
  isAVAX: boolean
  isZeroBalance: boolean
  isSwapBlocked: boolean
  isTokenSwappable: boolean
  hasEnoughAvax: boolean | undefined
  isEarnBlocked: boolean
}): {
  showBuy: boolean
  showSwap: boolean
  showStake: boolean
} => {
  // by default, hide all buttons
  let showBuy = false
  let showSwap = false
  let showStake = false

  // handle token from Coingeko search results
  if (marketType === MarketType.SEARCH) {
    // adjust nothing
  }

  // handle AVAX token
  else if (isAVAX) {
    if (!isSwapBlocked && !isZeroBalance) {
      showSwap = true
    }

    if (hasEnoughAvax && !isEarnBlocked) {
      showStake = true
    } else {
      showBuy = true
    }
  }

  // handle other tokens
  else if (isTokenSwappable) {
    if (!isSwapBlocked && !isZeroBalance) {
      showBuy = true
      showSwap = true
    } else {
      showBuy = true
    }
  }

  return { showBuy, showSwap, showStake }
}
