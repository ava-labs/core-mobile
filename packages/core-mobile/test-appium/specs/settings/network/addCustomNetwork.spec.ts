import warmup from '../../../helpers/warmup'
import settingsPage from '../../../pages/settings.page'
import sl from '../../../locators/settings.loc'
import common from '../../../pages/commonEls.page'
import { actions } from '../../../helpers/actions'
import { selectors } from '../../../helpers/selectors'

describe('Settings', () => {
  it('Custom network -should add custom network', async () => {
    await warmup()
    await common.goSettings()
    await settingsPage.tapNetworks()
    await settingsPage.addNetwork(
      sl.celoNetworkName,
      sl.celoRpcUrl,
      sl.celoChainID,
      sl.celoNativeTokenSymbol,
      sl.celoNativeTokenName
    )
    await settingsPage.verifyNetworkRow(sl.celoNetworkName, true, true)
  })

  it('Custom network - should edit custom network', async () => {
    await settingsPage.tapNetworkByName(sl.celoNetworkName)
    await settingsPage.addContactOrNetworkName(sl.celoWrongNetworkName, true)
    await settingsPage.verifyNetworkRow(sl.celoWrongNetworkName, true, true)
  })

  it('Custom network - should remove custom network', async () => {
    await settingsPage.tapNetworkByName(sl.celoWrongNetworkName)
    await common.tapDelete()
    await common.tapDelete()
    await actions.isNotVisible(
      selectors.getById(`network_list__${sl.celoWrongNetworkName}`)
    )
  })
})
