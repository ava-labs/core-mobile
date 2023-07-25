import { test, expect } from '@playwright/test'
import actions from '../../helpers/actions'
import CommonPlaywrightPage from '../../pages/commonPlaywrightEls.page'
import OasisPage from '../../pages/oasis.page'

test('check wallet connect button', async ({ page }) => {
  const commonEls = new CommonPlaywrightPage(page)
  const oasisPage = new OasisPage(page)

  await actions.openPage(oasisPage.page, oasisPage.oasisHomepage)
  await expect(commonEls.connectWalletBtn).toBeVisible()
  await commonEls.clickConnectWalletBtn()
  await expect(commonEls.walletConnectBtn).toBeVisible()
  await commonEls.clickWalletConnectBtn()
  await expect(commonEls.w3mWalletUri).toBeVisible()
  const qrUri = await commonEls.qrUriValue('w3m')

  if (qrUri) {
    await actions.writeQrCodeToFile(qrUri)
  }

  console.log('URI: ', qrUri)
})
