
describe('Example', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  // beforeEach(async () => {
  //   await device.reloadReactNative()
  // })

  it('should have create new wallet button', async () => {
    await expect(element(by.text('Existing Wallet')).atIndex(1)).toBeVisible()
  })

  // eslint-disable-next-line jest/expect-expect
  it('should show recovery phrase after tap', async () => {
    await element(by.id('walletSVG')).atIndex(1).tap()
    await element(by.id('recoveryPhraseTextInput')).typeText(
      process.env.RECOVERY_PHRASE
    )
    await element(by.text('Sign in')).tap()
    for (let i = 0; i < 12; i++) {
      await element(by.id('0')).tap()
    }
  })
})
