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

  // Creates an object of all of the recovery phrase words with an index
  async mnemonicWordsObject() {
    const wordNumberAttributes = await element(
      by.id('mnemonicWordsView')
    ).getAttributes()
    const viewAttributesArray = wordNumberAttributes.elements
    const mnemonicWordIndexArray = []
    viewAttributesArray.forEach(function (item) {
      const elementLabel = item.label
      const mnemonicWord = elementLabel.split('.')[1].replace(' ', '')
      const mnemonicNum = elementLabel.split('.')[0].replace('.', '')
      mnemonicWordIndexArray.push({ mnemonicNum, mnemonicWord })
    })
    const mnemonicMapped = mnemonicWordIndexArray.map(item => ({
      [item.mnemonicNum]: item.mnemonicWord
    }))
    const mnemonicObject = Object.assign({}, ...mnemonicMapped)

    return mnemonicObject
  }
}
export default new NewRecoveryPhrasePage()
