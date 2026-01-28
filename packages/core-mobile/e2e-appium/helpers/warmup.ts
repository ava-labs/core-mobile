import onboardingPage from '../pages/onboarding.page'

export default async function warmup(
  mnemonic = process.env.E2E_MNEMONIC as string
) {
  await onboardingPage.exitMetro()
  await onboardingPage.tapAccessExistingWallet()
  await onboardingPage.tapTypeInRecoveryPhase()
  await onboardingPage.tapAgreeAndContinue()
  await onboardingPage.tapUnlockBtn()
  await onboardingPage.enterRecoveryPhrase(mnemonic)
  await onboardingPage.tapImport()
  await onboardingPage.enterPin()
  await onboardingPage.enterWalletName()
  await onboardingPage.tapNextBtnOnNameWallet()
  await onboardingPage.tapNextBtnOnAvatarScreen()
  await onboardingPage.tapLetsGo()
  await onboardingPage.verifyLoggedIn()
}

export async function restartAndUnlock() {
  const appId = 'org.avalabs.corewallet'
  try {
    await driver.terminateApp(appId)
    await driver.activateApp(appId)
    await onboardingPage.exitMetroAfterLogin()
  } catch (error) {
    await driver.terminateApp(appId + '.internal')
    await driver.activateApp(appId + '.internal')
  }
  await onboardingPage.tapKeypadUpButton()
  await onboardingPage.tapZero()
}
