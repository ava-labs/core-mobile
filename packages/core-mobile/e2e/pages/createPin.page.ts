import createPinLoc from '../locators/createPin.loc'
import Action from '../helpers/actions'

class CreatePinPage {
  get numpadZero() {
    return by.id(createPinLoc.numPadZero)
  }

  get numpadOne() {
    return by.id(createPinLoc.numpadOne)
  }

  get agreeAndContinueBtn() {
    return by.text(createPinLoc.agreeAndContinueBtn)
  }

  get nextBtn() {
    return by.text(createPinLoc.nextBtn)
  }

  get enterYourPinHeader() {
    return by.text(createPinLoc.enterYourPinHeader)
  }

  get setNewPinHeader() {
    return by.text(createPinLoc.setNewPinHeader)
  }

  get signInWithRecoveryPhraseBtn() {
    return by.id(createPinLoc.signInWithRecoveryPhraseBtn)
  }

  get fingerprint() {
    return by.text(createPinLoc.fingerprint)
  }

  get skipBtn() {
    return by.text(createPinLoc.skipBtn)
  }

  async tapSignInWithRecoveryPhraseBtn() {
    await Action.tap(this.signInWithRecoveryPhraseBtn)
  }

  async tapNumpadZero() {
    await Action.multiTap(this.numpadZero, 6, 0)
  }

  async tapNumpadZero5Times() {
    await element(this.numpadZero).multiTap(5)
  }

  async tapNumpadOne() {
    await Action.tap(this.numpadOne)
  }

  async tapNextBtn() {
    await Action.tap(this.nextBtn)
  }

  async tapSkipBtn() {
    await Action.tap(this.skipBtn)
  }

  async tapAgreeAndContinueBtn() {
    if (await Action.isVisible(this.fingerprint, 0)) {
      await this.tapSkipBtn()
    }
    await Action.tapElementAtIndex(this.agreeAndContinueBtn, 0)
    console.log('yo')
  }

  async tapNumpadZero6Times() {
    await element(this.numpadZero).multiTap(6)
  }

  async createPin() {
    while (await Action.isVisible(this.numpadZero, 0)) {
      if (
        (await Action.isVisible(this.agreeAndContinueBtn, 0)) ||
        (await Action.isVisible(this.fingerprint, 0))
      ) {
        break
      }
      await this.tapNumpadZero6Times()
    }
  }

  async enterNewCurrentPin() {
    while (await Action.isVisible(this.setNewPinHeader, 0)) {
      await element(this.numpadOne).multiTap(6)
    }
  }

  async enterCurrentPin(pin = '0') {
    while (await Action.isVisible(this.enterYourPinHeader, 0)) {
      await element(by.id(pin)).multiTap(6)
    }
  }
}

export default new CreatePinPage()
