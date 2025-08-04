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
  marketType: MarketType
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
  // eslint-disable-next-line sonarjs/cognitive-complexity
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
    if (isZeroBalance) {
      showBuy = true
    } else {
      if (hasEnoughAvax) {
        if (!isSwapBlocked) {
          showSwap = true
        }

        if (!isEarnBlocked) {
          showStake = true
        }
      } else {
        if (!isSwapBlocked) {
          showSwap = true
        }
      }
    }
  }

  // handle other tokens
  else if (isTokenSwappable) {
    if (!isSwapBlocked && !isZeroBalance) {
      showSwap = true
    } else {
      showBuy = true
    }
  }

  return { showBuy, showSwap, showStake }
}
