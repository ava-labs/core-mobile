import createPinLoc from '../locators/createPin.loc'
import Action from '../helpers/actions'

class CreatePinPage {
  get numPadZero() {
    return by.id(createPinLoc.numPadZero)
  }

  get emptyCheckBox() {
    return by.id(createPinLoc.emptyCheckBox)
  }

  get nextBtn() {
    return by.text(createPinLoc.nextBtn)
  }

  async tapNumpadZero() {
    await Action.tap(this.numPadZero)
  }

  async tapNextBtn() {
    await Action.tap(this.nextBtn)
  }

  async tapEmptyCheckbox() {
    await Action.tap(this.emptyCheckBox)
    await Action.tap(this.emptyCheckBox)
  }
}

export default new CreatePinPage()
