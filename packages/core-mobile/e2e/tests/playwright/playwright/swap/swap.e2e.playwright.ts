/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import actions from '../../../../helpers/actions'
import loginRecoverWallet from '../../../../helpers/loginRecoverWallet'
import commonElsPage from '../../../../pages/commonEls.page'
import connectToSitePage from '../../../../pages/connectToSite.page'
import plusMenuPage from '../../../../pages/plusMenu.page'
import popup from '../../../../pages/popUpModal.page'

describe('Swap Dapps', () => {
  beforeAll(async () => {
    await device.launchApp()
    await loginRecoverWallet.enterPin()
    await plusMenuPage.connectWallet()
    await connectToSitePage.selectAccountAndconnect()
    await popup.verifySuccessToast()
  }, 60000)

  it(`should swap via ${process.env.DAPP_NAME} dapps`, async () => {
    await actions.waitForElement(popup.popUpModalScrollView, 30000)
    await popup.verifyFeeIsLegit(true, false, 0.2)
    await commonElsPage.tapApproveButton()
    await actions.waitForElement(popup.successfulToastMsg, 120000)
  })
})
