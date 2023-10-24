import { test, expect } from '@playwright/test'
import actions from '../../helpers/actions'
import CommonPlaywrightPage from '../../pages/commonPlaywrightEls.page'
import BenqiPage from '../../pages/benqi.page'

test('check wallet connect button', async ({ page }) => {
  const commonEls = new CommonPlaywrightPage(page)
  const benqiPage = new BenqiPage(page)

  await actions.openPage(benqiPage.page, benqiPage.benqiHomepage)
  await expect(commonEls.connectWalletBtn).toBeVisible()
  await commonEls.clickConnectWalletBtn()
  await expect(commonEls.walletConnectBtn).toBeVisible()
  await commonEls.clickWalletConnectBtn()
  await expect(commonEls.wcmWalletUri).toBeVisible()
  const qrUri = await commonEls.qrUriValue('wcm')

  if (qrUri) {
    await actions.writeQrCodeToFile(qrUri)
  }

  console.log('URI: ', qrUri)
})
