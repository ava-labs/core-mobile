import newRecoveryPhraseLoc from '../locators/newRecoveryPhrase.loc'
import Action from '../helpers/actions'

class NewRecoveryPhrasePage {
  mnemonicNumber(num: string) {
    return by.id(num)
  }

  get mnemonicWord() {
    return by.id(newRecoveryPhraseLoc.mnemonicWord)
  }

  get iWroteItDownBtn() {
    return by.text(newRecoveryPhraseLoc.iWroteItDownBtn)
  }

  get iUnderstandBtn() {
    return by.text(newRecoveryPhraseLoc.warningModalIUnderstandBtn)
  }

  async tapIWroteItDownBtn() {
    return Action.tap(this.iWroteItDownBtn)
  }

  async tapIUnderstandBtn() {
    return Action.tap(this.iUnderstandBtn)
  }

  async mnemonicWordsObject() {
    const attributes = await Action.getAttributes(this.mnemonicWord)
    const attributesArray = attributes.elements
    const mnemonicWordArray: string | unknown[] = []
    attributesArray.forEach(function (item: object) {
      const textAttribute = item.text
      mnemonicWordArray.push(textAttribute)
    })
    const mnemonicObject = Object.assign({}, mnemonicWordArray)
    return mnemonicObject
  }
}
export default new NewRecoveryPhrasePage()
