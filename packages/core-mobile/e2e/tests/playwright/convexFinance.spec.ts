import { test, expect } from '@playwright/test'
import actions from '../../helpers/actions'
import CommonPlaywrightPage from '../../pages/commonPlaywrightEls.page'
import ConvexFinancePage from '../../pages/convexFinance.page'

test('check wallet connect button', async ({ page }) => {
  const commonEls = new CommonPlaywrightPage(page)
  const convexFinancePage = new ConvexFinancePage(page)

  await actions.openPage(
    convexFinancePage.page,
    convexFinancePage.convexFinanceHomepage
  )
  await expect(commonEls.connectWalletBtn).toBeVisible()
  await commonEls.clickConnectWalletBtn()
  await expect(convexFinancePage.walletConnectV2Btn).toBeVisible()
  await convexFinancePage.clickWalletConnectV2Btn()
  await expect(commonEls.wcmWalletUri).toBeVisible()
  const qrUri = await commonEls.qrUriValue('wcm')

  if (qrUri) {
    await actions.writeQrCodeToFile(qrUri)
  }

  console.log('URI: ', qrUri)
})
