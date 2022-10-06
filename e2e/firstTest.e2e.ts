/* eslint-env detox/detox, jest */
import { by, expect, element } from 'detox'

// This is our first test, more will be added soon

describe('Add existing wallet', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  it('should have create new wallet button', async () => {
    await expect(element(by.text('Existing Wallet')).atIndex(1)).toBeVisible()
  })

  it('should successfully add an existing wallet', async () => {
    const recoveryPhrase: string = process.env.RECOVERY_PHRASE as string
    await element(by.id('walletSVG')).atIndex(1).tap()
    await element(by.id('recoveryPhraseTextInput')).replaceText(recoveryPhrase)
    await element(by.text('Sign in')).tap()
    for (let i = 0; i < 12; i++) {
      await element(by.id('0')).tap()
    }
    await element(by.id('checkBoxEmpty')).atIndex(1).tap()
    await element(by.id('checkBoxEmpty')).tap()
    await element(by.text('Next')).tap()
    await expect(await element(by.text('Collectibles'))).toBeVisible()
  })
})
