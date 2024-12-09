import { test } from '@playwright/test'
import CommonPlaywrightPage from '../../pages/commonPlaywrightEls.page'
import actions from '../../helpers/playwrightActions'
import { playwrightSetup } from '../../helpers/playwrightSetup'
import DappsPlaywrightPage from '../../pages/dappsPlaywright.page'

const getContext = playwrightSetup()

test('Connect MultiChain', async () => {
  const { page } = getContext()
  const common = new CommonPlaywrightPage(page)
  const dapps = new DappsPlaywrightPage(page)

  await actions.open(dapps.multichainUrl, dapps.page)
  await common.tapConnectWallet()
  await common.tapWalletConnect()
  await common.tapCopy()
  const clipboardValue = await page.evaluate(() => {
    // @ts-ignore
    return navigator.clipboard.readText()
  })
  await actions.writeQrCodeToFile(clipboardValue)
  console.log('URI: ', clipboardValue)
})
