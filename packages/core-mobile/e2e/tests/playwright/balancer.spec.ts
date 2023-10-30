import { test, expect } from '@playwright/test'
import actions from '../../helpers/actions'
import CommonPlaywrightPage from '../../pages/commonPlaywrightEls.page'
import BalancerPage from '../../pages/balancer.page'

test('check wallet connect button', async ({ page }) => {
  const commonEls = new CommonPlaywrightPage(page)
  const balancerPage = new BalancerPage(page)

  await actions.openPage(balancerPage.page, balancerPage.balancerHomepage)
  await expect(balancerPage.connectWalletBtn).toBeVisible()
  await balancerPage.clickConnectWalletBtn()
  await expect(balancerPage.tosCheckbox).toBeVisible()
  await balancerPage.clickTosCheckbox()
  await expect(balancerPage.walletConnectBtn).toBeVisible()
  await balancerPage.clickWalletConnectBtn()
  await expect(commonEls.wcmWalletUri).toBeVisible()
  const qrUri = await commonEls.qrUriValue('wcm')

  if (qrUri) {
    await actions.writeQrCodeToFile(qrUri)
  }

  console.log('URI: ', qrUri)
})
