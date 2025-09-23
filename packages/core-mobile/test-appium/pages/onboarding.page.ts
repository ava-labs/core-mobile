/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import onboardingLoc from '../locators/onboarding.loc'

class OnboardingPage {
  get accessExistingWallet() {
    return selectors.getByText(onboardingLoc.accessExistingWallet)
  }

  get chooseWalletTitle() {
    return selectors.getByText(onboardingLoc.chooseWalletTitle)
  }

  async tapAccessExistingWallet() {
    await actions.tap(this.accessExistingWallet)
  }

  async verifyOnboarding() {
    await actions.isVisible(this.chooseWalletTitle)
    await actions.isVisible(this.accessExistingWallet, false)
  }
}

export default new OnboardingPage()
