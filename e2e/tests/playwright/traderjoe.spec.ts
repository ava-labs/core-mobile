import { test, expect } from '@playwright/test'
import actions from '../../helpers/actions'
import TraderJoePage from '../../pages/traderjoe.page'
const fs = require('fs')

test('check wallet connect button', async ({ page }) => {
  const traderJoePage = new TraderJoePage(page)

  await actions.openPage(traderJoePage.page, traderJoePage.homePage)
  await expect(traderJoePage.connectWalletButtonText).toBeVisible()
  await page.waitForTimeout(1000)
  await traderJoePage.clickConnectWalletButton()
  await page.waitForTimeout(1000)
  await traderJoePage.clickWalletConnectButton()
  await page.waitForTimeout(1000)
  await traderJoePage.clickOldWalletConnectModal()
  await page.waitForTimeout(1000)
  await traderJoePage.clickWalletConnectCode()
  await page.waitForTimeout(1500)

  const clipboardValue = await page.evaluate(() => {
    return navigator.clipboard.readText()
  })

  fs.writeFile(
    '/Users/tyler.hackett/avalanche-wallet-apps/e2e/tests/playwright/qr_codes.txt',
    clipboardValue,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (err: any) => {
      if (err) throw err
    }
  )

  console.log('Clipboard value:', clipboardValue)
})
