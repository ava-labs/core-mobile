import actions from '../../../../helpers/actions'
import { warmup } from '../../../../helpers/warmup'
import connectToSitePage from '../../../../pages/connectToSite.page'
import plusMenuPage from '../../../../pages/plusMenu.page'
import popUpModalPage from '../../../../pages/popUpModal.page'

describe('PlayWright Integration', () => {
  it(`should connect ${process.env.DAPP_NAME}`, async () => {
    await warmup()
    await plusMenuPage.connectWallet()
    try {
      await actions.waitForElement(popUpModalPage.approveBtn, 10000)
      await actions.tap(popUpModalPage.approveBtn)
    } catch (e) {
      console.log('No approve button is displayed')
    }
    await connectToSitePage.selectAccountAndconnect()
    await popUpModalPage.verifySuccessToast()
  })
})
