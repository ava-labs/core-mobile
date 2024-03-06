import { test, expect } from '@playwright/test'
import actions from '../../helpers/actions'
import CommonPlaywrightPage from '../../pages/commonPlaywrightEls.page'
import CompoundFinancePage from '../../pages/compoundFinance.page'

test('check wallet connect button', async ({ page }) => {
  const commonEls = new CommonPlaywrightPage(page)
  const compoundFinancePage = new CompoundFinancePage(page)

  await actions.openPage(
    compoundFinancePage.page,
    compoundFinancePage.compoundFinanceHomepage
  )
  await expect(commonEls.connectWalletBtn).toBeVisible()
  await commonEls.clickConnectWalletBtn()
  await expect(commonEls.walletConnectBtn).toBeVisible()
  await commonEls.clickWalletConnectBtn(1)
  await expect(commonEls.wuiQrCodeUri).toBeVisible()
  const qrUri = await commonEls.qrUriValue('w3m')

  if (qrUri) {
    await actions.writeQrCodeToFile(qrUri)
  }

  console.log('URI: ', qrUri)
})
