import settings from '../../pages/settings.page'
import sl from '../../locators/settings.loc'
import common from '../../pages/commonEls.page'
import warmup from '../../helpers/warmup'
import { networks } from '../../helpers/networks'
import portfolioPage from '../../pages/portfolio.page'

describe('Settings', () => {
  it('Networks - should have all default networks', async () => {
    await warmup()
    await settings.goNetworks()
    await settings.verifyDefaultNetworks()
  })

  it('Networks - should verify the default network details', async () => {
    for (const network of networks) {
      await settings.verifyNetworkDetails(network)
      console.log('Verified network:', network.name)
    }
  })

  it('Networks - should toggle default and L1 networks', async () => {
    // Disable default networks
    const networksToToggle = [
      ...networks,
      { name: sl.beamL1, haveToggle: true }
    ]
    await settings.tapNetworkSwitches(true)
    await common.dismissBottomSheet()
    await portfolioPage.verifyNetworksRemoved(networks)
    await settings.goNetworks()
    console.log('Disabled default networks')
    // Enable default networks
    await settings.tapNetworkSwitches(false, networksToToggle)
    await common.dismissBottomSheet()
    await portfolioPage.verifyNetworksAdded(networksToToggle)
    console.log('Enabled default networks')
  })
})
