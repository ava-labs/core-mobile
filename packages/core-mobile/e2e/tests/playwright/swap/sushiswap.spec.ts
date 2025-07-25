import { test } from '@playwright/test'
import actions from '../../../helpers/playwrightActions'
import { playwrightSetup } from '../../../helpers/playwrightSetup'
import delay from '../../../helpers/waits'

test('Swap on SushiSwap', async () => {
  const { common, dapps } = await playwrightSetup()

  // Connect
  await actions.open(dapps.sushiswapUrl, dapps.page)
  await actions.tap(dapps.sushiAcceptCookies)
  await common.tapConnectWallet()
  await common.tapWalletConnect()
  await common.tapOpen()
  const qrUri = await common.qrUriValue()
  if (qrUri) {
    await actions.writeQrCodeToFile(qrUri)
  }
  console.log('URI: ', qrUri)

  // Swap
  await common.waitForQrUriNotVisible()
  await dapps.sushiFromAmount.fill('0.00001')
  await actions.tap(dapps.sushiSwitchToCChainBtn)
  await actions.tap(dapps.sushiFirstSwapBtn)
  await actions.tap(dapps.sushiSecondSwapBtn)
  await delay(5000)
})
