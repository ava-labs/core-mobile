import settings from '../../pages/settings.page'
import sl from '../../locators/settings.loc'
import common from '../../pages/commonEls.page'
import warmup from '../../helpers/warmup'

describe('Settings', () => {
  it('Networks - should have all default networks', async () => {
    // go to the account detail from the accounts carousel
    await warmup()
    await settings.goSettings()
    await settings.tapNetworks()
    await common.verifyAccountName(sl.account)
  })

  it('Networks - should toggle default networks', async () => {
    await settings.verifyNetworkRow(sl.celoNetworkName, true, true)
  })

  it('Networks - should toggle a L1 network', async () => {
    // Rename on account detail
    await settings.tapRenameAccount()
    await settings.setNewAccountName(sl.newAccountName)

    // Verify the new name on account detail
    await common.verifyAccountName(sl.newAccountName)

    // Verify the new name on portfolio page
    await common.dismissBottomSheet()
    await common.verifyAccountName(sl.newAccountName, 'portfolio')

    // Verify the new name on account carousel
    await settings.goSettings()
    await settings.verifyAccountCarouselItem(sl.newAccountName)
  })

  it('Networks - should add a custom network', async () => {
    await settings.addNetwork(sl.celoNetworkName, sl.celoRpcUrl, sl.celoChainID, sl.celoNativeTokenSymbol, sl.celoNativeTokenName)
    await settings.verifyNetworkRow(sl.celoNetworkName, true, true)
  })

  it('Networks - should edit a custom network', async () => {
    await settings.tapNetworkByName(sl.celoNetworkName)
    await settings.addContactOrNetworkName(sl.celoWrongNetworkName, true)
    await settings.verifyNetworkRow(sl.celoWrongNetworkName, true, true)
  })

  it('Networks - should remove a custom network', async () => {
    await settings.tapNetworkByName(sl.celoWrongNetworkName)
    await common.tapDelete()
    await common.tapDelete()
    await Assert.isNotVisible(by.id(`network_list__${sl.celoWrongNetworkName}`))
})
})