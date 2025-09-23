/* eslint-disable @typescript-eslint/explicit-function-return-type */
import onboardingPage from '../pages/onboarding.page'

export default async function login() {
  await onboardingPage.tapAccessExistingWallet()
  await onboardingPage.verifyOnboarding()
}
