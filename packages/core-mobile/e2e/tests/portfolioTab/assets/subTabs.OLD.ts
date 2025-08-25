/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Actions from '../../../helpers/actions'
import { warmup } from '../../../helpers/warmup'
import portfolioLoc from '../../../locators/portfolio.loc'
import portfolioPage from '../../../pages/portfolio.page'

describe('Sub tabs on Portfolio', () => {
  beforeAll(async () => {
    await warmup()
  })

  const subTabs: string[] = [
    portfolioLoc.assetsTab,
    portfolioLoc.collectiblesTab,
    portfolioLoc.defiTab
  ]

  const networks: string[] = [
    portfolioLoc.avaxNetwork,
    portfolioLoc.avaxPNetwork,
    portfolioLoc.avaxXNetwork,
    portfolioLoc.btcNetwork,
    portfolioLoc.ethNetwork
  ]

  it('should navigate sub tabs fine', async () => {
    for (let i = 0; i < 5; i++) {
      const randomIndex = Actions.getRandomIndex(subTabs.length)
      if (subTabs[randomIndex]) {
        await Actions.tapElementAtIndex(by.text(subTabs[randomIndex]), 0)
        await portfolioPage.verifySubTab(subTabs[randomIndex])
      }
    }
  })

  it('should display sub tabs dynamically', async () => {
    const shuffleNetworks: string[] = networks.sort(() => Math.random() - 0.5)
    for (let i = 0; i < shuffleNetworks.length; i++) {
      const network = shuffleNetworks[i]
      if (network) {
        console.log(`testing ${network}'s subtabs`)
        const all =
          network === portfolioLoc.avaxNetwork ||
          network === portfolioLoc.ethNetwork
        await portfolioPage.verifySubTabs(all)
      }
    }
  })

  it('should have three sub tabs', async () => {
    await portfolioPage.verifySubTabs()
  })

  it('should have two sub tabs', async () => {
    await portfolioPage.verifySubTabs(false)
  })
})
