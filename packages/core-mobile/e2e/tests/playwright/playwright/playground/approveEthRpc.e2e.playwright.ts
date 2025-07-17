/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { expect } from '@jest/globals'
import actions from '../../../../helpers/actions'
import loginRecoverWallet from '../../../../helpers/loginRecoverWallet'
import playwrightActions from '../../../../helpers/playwrightActions'
import connectToSitePage from '../../../../pages/connectToSite.page'
import plusMenuPage from '../../../../pages/plusMenu.page'
import popup from '../../../../pages/popUpModal.page'

describe('Playground', () => {
  afterEach(async () => {
    const testName = expect.getState().currentTestName || 'unknown'
    const testStatus = expect.getState().isNot ? 'FAIL' : 'PASS'
    playwrightActions.addTestResultToFile(
      testName,
      testStatus,
      'detox',
      './e2e/tests/dapps/playwright/factory/detoxResults.json'
    )
  })

  beforeAll(async () => {
    await device.launchApp()
    await loginRecoverWallet.enterPin()
    await plusMenuPage.connectWallet()
    await connectToSitePage.selectAccountAndconnect()
    await popup.verifySuccessToast()
  })

  it('eth_sendTransaction', async () => {
    await actions.waitForElement(popup.approveTransactionTitle, 30000)
    await actions.tap(popup.approveBtn)
  })

  it('eth_signTypedData_v3', async () => {
    await actions.waitForElement(popup.signMessage, 30000)
    await actions.tap(popup.approveBtn)
  })

  it('eth_signTypedData_v4', async () => {
    await actions.waitForElement(popup.signMessage, 30000)
    await actions.tap(popup.approveBtn)
  })

  it('eth_signTypedData', async () => {
    await actions.waitForElement(popup.signMessage, 30000)
    await actions.tap(popup.approveBtn)
  })

  it('personal_sign', async () => {
    await actions.waitForElement(popup.signMessage, 30000)
    await actions.tap(popup.approveBtn)
  })

  it('eth_sign', async () => {
    await actions.waitForElement(popup.proceedAnyway, 30000)
    await actions.tap(popup.proceedAnyway)
    await actions.waitForElement(popup.approveBtn, 30000)
    await actions.tap(popup.rejectBtn)
  })
})
