import settings from '../../pages/settings.page'
import common from '../../pages/commonEls.page'
import warmup from '../../helpers/warmup'
import { customNetwork } from '../../helpers/networks'
import portfolioPage from '../../pages/portfolio.page'
import { actions } from '../../helpers/actions'
import { selectors } from '../../helpers/selectors'

describe('Settings', () => {
  it('Custom Networks - should add a custom network', async () => {
    await warmup()
    await settings.goNetworks()
    await settings.addNetwork(customNetwork)
    await settings.verifyNetworkDetails(customNetwork)
  })

  it('Custom Networks - should toggle a custom network', async () => {
    // Enable a custom network
    await common.typeSearchBar(customNetwork.name)
    await settings.tapNetworkSwitch(customNetwork.name)
    await common.dismissBottomSheet()
    await portfolioPage.verifyNetworksRemoved([customNetwork])
    await settings.goNetworks()
    // Disable a custom network
    await common.typeSearchBar(customNetwork.name)
    await settings.tapNetworkSwitch(customNetwork.name, false)
    await common.dismissBottomSheet()
    await portfolioPage.verifyNetworksAdded([customNetwork])
  })

  it('Custom Networks - should edit a custom network', async () => {
    const networkWrongName = 'POLYGON (WRONG)'
    await settings.goNetworks()
    await settings.tapNetworkByName(customNetwork.name)
    await settings.editNetwork(networkWrongName)
    await settings.verifyNetworkDetails({
      ...customNetwork,
      name: 'POLYGON (WRONG)'
    })
  })

  it('Custom Networks - should remove a custom network', async () => {
    const networkName = 'POLYGON (WRONG)'
    await settings.removeNetwork(networkName)
    await common.typeSearchBar(networkName)
    await actions.isNotVisible(
      selectors.getByText(`network_toggle_enabled__${networkName}`)
    )
    await actions.isNotVisible(
      selectors.getByText(`network_toggle_disabled__${networkName}`)
    )
  })
})
