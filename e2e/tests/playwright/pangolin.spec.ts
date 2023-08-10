import { test, expect } from '@playwright/test'
import CommonPlaywrightPage from '../../pages/commonPlaywrightEls.page'
import PangolinPage from '../../pages/pangolin.page'
import actions from '../../helpers/actions'

test('check wallet connect button', async ({ page }) => {
  const commonEls = new CommonPlaywrightPage(page)
  const pangolinPage = new PangolinPage(page)

  await actions.openPage(pangolinPage.page, pangolinPage.pangolinHomepage)

  await expect(commonEls.connectToAWalletBtn).toBeVisible()
  await commonEls.clickConnectToAWalletBtn()
  await expect(commonEls.walletConnectBtn).toBeVisible()
  await commonEls.clickWalletConnectBtn()
  await expect(commonEls.connectWalletBtn).toBeVisible()
  await commonEls.clickConnectWalletBtn()

  await pangolinPage.decodeQrCode()
})
