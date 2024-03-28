import { test, expect } from '@playwright/test'
import actions from '../../helpers/actions'
import CommonPlaywrightPage from '../../pages/commonPlaywrightEls.page'
import CoreAppPage from '../../pages/coreApp.page'

test('check wallet connect button', async ({ page }) => {
  const commonEls = new CommonPlaywrightPage(page)
  const coreAppPage = new CoreAppPage(page)

  await actions.openPage(coreAppPage.page, coreAppPage.coreAppHomepage)
  await page.setViewportSize({ width: 2080, height: 1080 })
  await expect(coreAppPage.connectWalletBtn).toBeEnabled({ timeout: 10000 })
  await coreAppPage.clickConnectWalletBtn()
  await expect(commonEls.walletConnectBtn).toBeVisible()
  await commonEls.clickWalletConnectBtn()
  await expect(coreAppPage.termsCheckBox).toBeVisible()
  await coreAppPage.clickAcceptTermsCheckbox()
  await expect(coreAppPage.continueBtn).toBeVisible()
  await coreAppPage.clickContinueBtn()
  await expect(commonEls.walletConnectBtn).toBeVisible()
  await commonEls.clickWalletConnectBtn()
  await expect(commonEls.wuiQrCodeUri).toBeVisible()
  const qrUri = await commonEls.qrUriValue('w3m')

  if (qrUri) {
    await actions.writeQrCodeToFile(qrUri)
  }

  console.log('URI: ', qrUri)
})
