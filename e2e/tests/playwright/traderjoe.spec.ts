import { test, expect } from '@playwright/test'
import actions from '../../helpers/actions'
import TraderJoePage from '../../pages/traderjoe.page'

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

  console.log('Clipboard value:', clipboardValue)
})
