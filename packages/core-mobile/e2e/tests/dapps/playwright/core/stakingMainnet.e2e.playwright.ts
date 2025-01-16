/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { expect } from '@jest/globals'
import actions from '../../../../helpers/actions'
import playwrightActions from '../../../../helpers/playwrightActions'
import connectToSitePage from '../../../../pages/connectToSite.page'
import plusMenuPage from '../../../../pages/plusMenu.page'
import popup from '../../../../pages/popUpModal.page'
import { warmup } from '../../../../helpers/warmup'
import advancedPage from '../../../../pages/burgerMenu/advanced.page'

describe('Mainnet - Cross Chain Transfer', () => {
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
    await warmup()
    await advancedPage.switchToMainnet()
    await plusMenuPage.connectWallet()
    await connectToSitePage.selectAccountAndconnect()
    await popup.verifySuccessToast()
  })

  it('Mainnet - cross chain transfer C to P', async () => {
    await popup.verifyExportDetail('C', 'P')
    await actions.tap(popup.approveBtn)
    await popup.verifyImportDetail('C', 'P')
    await actions.tap(popup.approveBtn)
  })

  it('Mainnet - cross chain transfer C to X', async () => {
    await popup.verifyExportDetail('C', 'X')
    await actions.tap(popup.approveBtn)
    await popup.verifyImportDetail('C', 'X')
    await actions.tap(popup.approveBtn)
  })

  it('Mainnet - cross chain transfer P to C', async () => {
    await popup.verifyExportDetail('P', 'C')
    await actions.tap(popup.approveBtn)
    await popup.verifyImportDetail('P', 'C')
    await actions.tap(popup.approveBtn)
  })

  it('Mainnet - cross chain transfer P to X', async () => {
    await popup.verifyExportDetail('P', 'X')
    await actions.tap(popup.approveBtn)
    await popup.verifyImportDetail('P', 'X')
    await actions.tap(popup.approveBtn)
  })

  it('Mainnet - cross chain transfer X to C', async () => {
    await popup.verifyExportDetail('X', 'C')
    await actions.tap(popup.approveBtn)
    await popup.verifyImportDetail('X', 'C')
    await actions.tap(popup.approveBtn)
  })

  it('Mainnet - cross chain transfer X to P', async () => {
    await popup.verifyExportDetail('X', 'P')
    await actions.tap(popup.approveBtn)
    await popup.verifyImportDetail('X', 'P')
    await actions.tap(popup.approveBtn)
  })
})
