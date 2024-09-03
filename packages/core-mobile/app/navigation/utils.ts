import Logger from 'utils/Logger'
import { navigate } from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import { NetworkTokensTabs } from 'screens/portfolio/network/NetworkTokens'

export const navigateToChainPortfolio = async (): Promise<void> => {
  //AppNavigation.Portfolio.NetworkTokens
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
