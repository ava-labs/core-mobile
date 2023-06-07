import createPinLoc from '../locators/createPin.loc'
import Action from '../helpers/actions'
import delay from '../helpers/waits'

class CreatePinPage {
  get numPadZero() {
    return by.id(createPinLoc.numPadZero)
  }

  get numpadOne() {
    return by.id(createPinLoc.numpadOne)
  }

  get emptyCheckBox() {
    return by.id(createPinLoc.emptyCheckBox)
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

  async tapNumpadZero() {
    await Action.tap(this.numPadZero)
  }

  async tapNumpadOne() {
    await Action.tap(this.numpadOne)
  }

  async tapNextBtn() {
    await Action.tap(this.nextBtn)
  }

  async tapEmptyCheckbox() {
    await Action.tapElementAtIndex(this.emptyCheckBox, 0)
    await Action.tapElementAtIndex(this.emptyCheckBox, 0)
  }

  async createPin() {
    for (let i = 0; i < 12; i++) {
      await this.tapNumpadZero()
      await delay(500)
    }
  }

  async createNewPin() {
    for (let i = 0; i < 12; i++) {
      await this.tapNumpadOne()
      await delay(500)
    }
  }

  async enterNewCurrentPin() {
    for (let i = 0; i < 6; i++) {
      await this.tapNumpadOne()
      await delay(500)
    }
  }

  async enterCurrentPin() {
    for (let i = 0; i < 6; i++) {
      await this.tapNumpadZero()
      await delay(500)
    }
  }
}

export default new CreatePinPage()
