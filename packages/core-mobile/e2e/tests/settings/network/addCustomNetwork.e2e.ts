/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { warmup } from '../../../helpers/warmup'
import sp from '../../../pages/settings.page'
import sl from '../../../locators/settings.loc'
import cp from '../../../pages/commonEls.page'
import Assert from '../../../helpers/assertions'
import commonElsPage from '../../../pages/commonEls.page'

describe('Settings', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should add custom network', async () => {
    await cp.goSettings()
    await sp.tapNetworksRow()
    await sp.addNetwork(
      sl.celoNetworkName,
      sl.celoRpcUrl,
      sl.celoChainID,
      sl.celoNativeTokenSymbol,
      sl.celoNativeTokenName
    )
    await sp.verifyNetworkRow(sl.celoNetworkName, true, true)
  })

  it('should edit custom network', async () => {
    await sp.tapNetworkByName(sl.celoNetworkName)
    await sp.addContactOrNetworkName(sl.celoWrongNetworkName, true)
    await sp.verifyNetworkRow(sl.celoWrongNetworkName, true, true)
  })

  it('should remove custom network', async () => {
    await sp.tapNetworkByName(sl.celoWrongNetworkName)
    await commonElsPage.tapDelete()
    await commonElsPage.tapDelete()
    await Assert.isNotVisible(by.id(`network_list__${sl.celoWrongNetworkName}`))
  })
})
