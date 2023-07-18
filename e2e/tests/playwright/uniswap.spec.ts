import { test, expect } from '@playwright/test'
import actions from '../../helpers/actions'
import UniswapPage from '../../pages/uniswap.page'

test('check wallet connect button', async ({ page }) => {
  const uniswapPage = new UniswapPage(page)

  await actions.openPage(uniswapPage.page, uniswapPage.uniswapHomePage)
  await expect(uniswapPage.connectWalletBtn).toBeVisible()
  await page.waitForTimeout(1000)
  await uniswapPage.clickConnectBtn()
  await page.waitForTimeout(1000)
  await uniswapPage.clickWalletConnectBtn()
  await page.waitForTimeout(1000)
  const qrCode = await uniswapPage.qrCodeUri()

  if (qrCode) {
    actions.writeQrCodeToFile({ uniswap: qrCode })
  }
  console.log('Clipboard value:', qrCode)
})
