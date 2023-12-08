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

  async tapSignInWithRecoveryPhraseBtn() {
    await Action.tap(this.signInWithRecoveryPhraseBtn)
  }

  async tapNumpadZero() {
    await element(this.numpadZero).multiTap(6)
  }

  async tapNumpadOne() {
    await Action.tap(this.numpadOne)
  }

  async tapNextBtn() {
    await Action.tap(this.nextBtn)
  }

  async tapAgreeAndContinueBtn() {
    await Action.tapElementAtIndex(this.agreeAndContinueBtn, 0)
  }

  async tapNumpadZero6Times() {
    await element(this.numpadZero).multiTap(6)
  }

  async createPin() {
    for (let i = 0; i < 2; i++) {
      await this.tapNumpadZero6Times()
    }
  }

  async createNewPin() {
    for (let i = 0; i < 2; i++) {
      await element(this.numpadOne).multiTap(6)
    }
  }

  async enterNewCurrentPin() {
    await element(this.numpadOne).multiTap(6)
  }

  async enterCurrentPin() {
    await element(this.numpadZero).multiTap(6)
  }
}

export default new CreatePinPage()
