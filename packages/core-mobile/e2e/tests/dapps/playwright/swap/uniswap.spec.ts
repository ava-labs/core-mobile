import { test } from '@playwright/test'
import actions from '../../../../helpers/playwrightActions'
import { playwrightSetup } from '../../../../helpers/playwrightSetup'
import delay from '../../../../helpers/waits'

test('Swap on UniSwap', async () => {
  const { common, dapps } = await playwrightSetup()

  // Connect
  await actions.open(dapps.uniswapUrl, dapps.page)
  await common.tapConnectWallet()
  await common.tapWalletConnect()
  const qrUri = await common.qrUriValue()
  if (qrUri) {
    await actions.writeQrCodeToFile(qrUri)
  }
  console.log(qrUri)

  // Swap
  await actions.tap(dapps.uniFromToken)
  await actions.tap(dapps.uniAvaxToken)
  await actions.waitFor(dapps.uniSwitchToAvalanche)
  await dapps.uniFromAmount.fill('0.00001')
  await actions.tap(dapps.uniToToken)
  await actions.tap(dapps.uniUSDCToken)
  await actions.waitFor(dapps.uniReviewBtn, 10000)
  await actions.tap(dapps.uniReviewBtn)
  await actions.waitFor(dapps.uniSwap, 10000)
  while (!(await dapps.uniConfirmInWallet.isVisible())) {
    await actions.tap(dapps.uniSwap)
  }
  await delay(5000)
})
