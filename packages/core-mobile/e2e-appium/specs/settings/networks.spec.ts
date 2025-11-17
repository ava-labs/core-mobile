import settings from '../../pages/settings.page'
import sl from '../../locators/settings.loc'
import common from '../../pages/commonEls.page'
import warmup from '../../helpers/warmup'
import { Network, networks } from '../../helpers/networks'
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

  it('Networks - should toggle default networks', async () => {
    // Disable default networks
    await settings.tapNetworkSwitches(true)
    await common.dismissBottomSheet()
    await portfolioPage.verifyNetworksRemoved(networks)
    await settings.goNetworks()
    console.log('Disabled default networks')
    // Enable default networks
    await settings.tapNetworkS\witches(false)
    await common.dismissBottomSheet()
    await portfolioPage.verifyNetworksAdded(networks)
    console.log('Enabled default networks')
  })

  it('Networks - should toggle a L1 network', async () => {
    // Enable a L1 network
    const beamL1: Network = {
      name: sl.beamL1,
      haveToggle: true
    }
    await settings.goNetworks()
    await common.typeSearchBar(sl.beamL1)
    await settings.tapNetworkSwitch(sl.beamL1, false)
    await common.dismissBottomSheet()
    await portfolioPage.verifyNetworksAdded([beamL1])
    await settings.goNetworks()
    console.log('Enabled a L1 network')
    // Disable a L1 network
    await common.typeSearchBar(sl.beamL1)
    await settings.tapNetworkSwitch(sl.beamL1, true)
    await common.dismissBottomSheet()
    await portfolioPage.verifyNetworksRemoved([beamL1])
    console.log('Disabled a L1 network')
  })
})
