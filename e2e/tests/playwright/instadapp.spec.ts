import { test, expect } from '@playwright/test'
import actions from '../../helpers/actions'
import CommonPlaywrightPage from '../../pages/commonPlaywrightEls.page'
import InstadappPage from '../../pages/instadapp.page'

test('check wallet connect button', async ({ page }) => {
  const commonEls = new CommonPlaywrightPage(page)
  const instadappPage = new InstadappPage(page)

  await actions.openPage(instadappPage.page, instadappPage.instadappHomepage)
  await expect(instadappPage.connectBtn).toBeVisible()
  await instadappPage.clickConnectBtn()
  await expect(instadappPage.walletConnectV2Btn).toBeVisible()
  await instadappPage.clickWalletConnectV2Btn()
  await expect(commonEls.wcmWalletUri).toBeVisible()
  const qrUri = await commonEls.qrUriValue('wcm')

  if (qrUri) {
    await actions.writeQrCodeToFile(qrUri)
  }

  console.log('URI: ', qrUri)
})
