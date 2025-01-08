import Logger from 'utils/Logger'
import { navigate } from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import { NetworkTokensTabs } from 'screens/portfolio/network/NetworkTokens'

const DELAY_NAVIGATION = 1000

export const navigateToWatchlist = (coingeckoId: string | undefined): void => {
  setTimeout(async () => {
    Logger.info('navigating to watchlist tab')
    navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Wallet.Drawer,
        params: {
          screen: AppNavigation.Wallet.Tabs,
          params: {
            screen: AppNavigation.Tabs.Watchlist
          }
        }
      }
    })

    if (coingeckoId) {
      Logger.info(`navigating to watchlist token ${coingeckoId}`)

      navigate({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Wallet.TokenDetail,
          params: {
            tokenId: coingeckoId
          }
        }
      })
    }
  }, DELAY_NAVIGATION)
}

export const navigateToChainPortfolio = (): void => {
  setTimeout(async () => {
    Logger.info('navigating to chain portfolio')
    navigate({
      // @ts-ignore
      name: AppNavigation.Portfolio.NetworkTokens,
      // @ts-ignore
      params: { tabIndex: NetworkTokensTabs.Tokens }
    })
  }, 300)
}

export const navigateToClaimRewards = (): void => {
  setTimeout(async () => {
    Logger.info('navigating to claim rewards')
    navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Wallet.Earn,
        params: {
          screen: AppNavigation.Earn.ClaimRewards,
          params: {
            onBack: () =>
              navigate({
                //@ts-ignore
                name: AppNavigation.Tabs.Stake
              })
          }
        }
      }
    })
  }, DELAY_NAVIGATION)
}
