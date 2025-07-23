import { test } from '@playwright/test'
import actions from '../../../helpers/playwrightActions'
import { playwrightSetup } from '../../../helpers/playwrightSetup'
import delay from '../../../helpers/waits'

test('Swap on LFJ', async () => {
  const { common, dapps } = await playwrightSetup()

  // Connect
  await actions.open(dapps.lfjUrl, dapps.page)
  await common.tapConnectWallet()
  await actions.tap(dapps.lfjAgree)
  await common.tapWalletConnect()
  await common.tapOpen()
  const qrUri = await common.qrUriValue()
  if (qrUri) {
    await actions.writeQrCodeToFile(qrUri)
  }
  console.log('URI: ', qrUri)

  // Swap
  await common.waitForQrUriNotVisible()
  await dapps.lfjFromAmount.fill('0.00001')
  await actions.tap(dapps.lfjToSelectToken)
  await dapps.lfjSelectTokenSearchBar.fill('JOE')
  await actions.tap(dapps.lfjJoeToken)
  await actions.waitFor(dapps.lfjSelectTokenSearchBar, 5000, false)
  await actions.waitFor(dapps.lfjSwap, 10000)
  await actions.tap(dapps.lfjSwap)
  await delay(5000)
})
