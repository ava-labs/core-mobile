import onboardingPage from '../pages/onboarding.page'
import { actions } from './actions'

export default async function warmup(
  mnemonic = process.env.E2E_MNEMONIC as string
) {
  await onboardingPage.exitMetro()
  await actions.printScreen()
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

export async function unlockLoggedIn(pin = '000000') {
  await actions.tapNumberPad(pin)
}
