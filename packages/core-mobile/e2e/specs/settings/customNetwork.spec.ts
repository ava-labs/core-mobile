import settings from '../../pages/settings.page'
import common from '../../pages/commonEls.page'
import warmup, { restartAndUnlock } from '../../helpers/warmup'
import { customNetwork } from '../../helpers/networks'
import portfolioPage from '../../pages/portfolio.page'
import { actions } from '../../helpers/actions'
import { selectors } from '../../helpers/selectors'

const editedNetworkName = 'POLYGON (WRONG)'

describe('Settings', () => {
  before(async () => {
    await warmup()
    await settings.goNetworks()
    await settings.tapNetworkSwitches(true)
  })

  after(async () => {
    await restartAndUnlock()
    await settings.resetNetworks([customNetwork.name, editedNetworkName])
  })

  it('Custom Networks - should add a custom network', async () => {
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
    await settings.goNetworks()
    await settings.tapNetworkByName(customNetwork.name)
    await settings.editNetwork(editedNetworkName)
    await settings.verifyNetworkDetails({
      ...customNetwork,
      name: editedNetworkName
    })
  })

  it('Custom Networks - should remove a custom network', async () => {
    await settings.removeNetwork(editedNetworkName)
    await common.typeSearchBar(editedNetworkName)
    await actions.isNotVisible(
      selectors.getById(`network_toggle_enabled__${editedNetworkName}`)
    )
    await actions.isNotVisible(
      selectors.getById(`network_toggle_disabled__${editedNetworkName}`)
    )
  })
})
