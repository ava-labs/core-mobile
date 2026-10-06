import settings from '../../pages/settings.page'
import sl from '../../locators/settings.loc'
import common from '../../pages/commonEls.page'
import warmup from '../../helpers/warmup'
import { networks, Network } from '../../helpers/networks'
import portfolioPage from '../../pages/portfolio.page'
import commonElsLoc from '../../locators/commonEls.loc'

describe('Settings', () => {
  before(async () => {
    await warmup()
    await settings.goNetworks()
  })

  it('Networks - should list the default networks', async () => {
    await settings.verifyDefaultNetworks()
  })

  networks
    .filter(network => network.data)
    .forEach((network: Network) => {
      it(`Networks - should verify network details for ${network.name}`, async () => {
        await settings.verifyNetworkDetails(network)
      })
    })

  it('Networks - should toggle OFF networks', async () => {
    await settings.tapNetworkSwitches(true)
    await common.dismissBottomSheet()
    await portfolioPage.verifyNetworksRemoved(networks)
  })

  it('Networks - should toggle ON networks', async () => {
    // Disable default networks
    const networksToToggle = [
      ...networks.filter(network => network.name === commonElsLoc.optimism),
      { name: sl.beamL1, haveToggle: true }
    ]
    await settings.goNetworks()
    await settings.tapNetworkSwitches(false, networksToToggle)
    await common.dismissBottomSheet()
    await portfolioPage.verifyNetworksAdded(networksToToggle)
  })
})
