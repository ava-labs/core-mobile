/* eslint-disable jest/expect-expect */
import Assert from '../../../helpers/assertions'
import ReceivePage from '../../../pages/receive.page'
import { warmup } from '../../../helpers/warmup'
import bottomTabsPage from '../../../pages/bottomTabs.page'
import plusMenuPage from '../../../pages/plusMenu.page'
import LoginRecoverWallet from '../../../helpers/loginRecoverWallet'
import portfolioPage from '../../../pages/portfolio.page'
import actions from '../../../helpers/actions'

describe('Receive Address', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('should validate receive address screen', async () => {
    await bottomTabsPage.tapPlusIcon()
    await plusMenuPage.tapReceiveButton()
    await ReceivePage.verifyReceiveAddressPage()
  })

  it('should copy receive address', async () => {
    await ReceivePage.tapReceiveAddress()
    await Assert.isVisible(ReceivePage.copiedToastMsg)
    await Assert.isVisible(ReceivePage.receiveAddress)
  })

  it('should show bitcoin logo', async () => {
    await portfolioPage.tapNetworksDropdown()
    await portfolioPage.tapNetworksDropdownBTC()
    await actions.isVisible(ReceivePage.btcLogo, 1)
  })

  it('should show ethereum logo', async () => {
    await portfolioPage.tapNetworksDropdown()
    await portfolioPage.tapNetworksDropdownETH()
    await actions.isVisible(ReceivePage.ethLogo, 1)
  })

  it('should show avalanche logo', async () => {
    await portfolioPage.tapNetworksDropdown()
    await portfolioPage.tapNetworksDropdownAVAX()
    await actions.isVisible(ReceivePage.avaLogo, 1)
  })
})
