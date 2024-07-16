import newRecoveryPhraseLoc from '../locators/newRecoveryPhrase.loc'
import Action from '../helpers/actions'
import Assert from '../helpers/assertions'

class NewRecoveryPhrasePage {
  mnemonicNumber(num: string) {
    return by.id(num)
  }

  get newRecoveryPhraseTitle() {
    return by.text(newRecoveryPhraseLoc.newRecoveryPhraseContent)
  }

  get newRecoveryPhraseContent() {
    return by.text(newRecoveryPhraseLoc.newRecoveryPhraseContent)
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

  get copyPhraseBtn() {
    return by.id(newRecoveryPhraseLoc.copyPhraseBtn)
  }

  get mnemonicPhraseInstructions() {
    return by.id(newRecoveryPhraseLoc.mnemonicPhraseInstructions)
  }

  get protectFundsModalTitle() {
    return by.id(newRecoveryPhraseLoc.warningModalTitle)
  }

  get protectFundsModalBackBtn() {
    return by.text(newRecoveryPhraseLoc.warningModalBackBtn)
  }

  get protectFundsModalMsg() {
    return by.id(newRecoveryPhraseLoc.warningModalMessage)
  }

  get securityWarningTitle() {
    return by.text(newRecoveryPhraseLoc.securityWarningTitle)
  }

  get securityWarningContent() {
    return by.text(newRecoveryPhraseLoc.securityWarningContent)
  }

  get copyAnyway() {
    return by.text(newRecoveryPhraseLoc.copyAnyway)
  }

  get cancel() {
    return by.text(newRecoveryPhraseLoc.cancel)
  }

  get copied() {
    return by.text(newRecoveryPhraseLoc.copied)
  }

  async tapIWroteItDownBtn() {
    return Action.tap(this.iWroteItDownBtn)
  }

  async tapIUnderstandBtn() {
    return Action.tap(this.iUnderstandBtn)
  }

  async tapCopyPhrase() {
    return Action.tap(this.copyPhraseBtn)
  }

  async getAndroidWordsObject() {
    const androidWordObjects = []
    for (let i = 0; i < 24; i++) {
      const wordNumberAttributes = element(this.mnemonicWord).atIndex(i)
      const wordAtts = await wordNumberAttributes.getAttributes()
      // @ts-ignore
      const mnemonicWord = wordAtts.text
      const indexNumber = i + 1
      const mnemonicNum = indexNumber.toString()
      androidWordObjects.push({ mnemonicWord, mnemonicNum })
    }

    return androidWordObjects
  }

  async getIosWordsObject() {
    const wordNumberAttributes = await element(
      by.id('mnemonic_ava__words_view')
    ).getAttributes()
    // Must ignore this TS error because the elements type hasn't been implemented by detox
    // @ts-ignore
    const viewAttributesArray = wordNumberAttributes.elements
    const mnemonicWordIndexArray: {
      mnemonicNum: string
      mnemonicWord: string
    }[] = []
    viewAttributesArray.forEach(function (item: { label: string }) {
      const elementLabel = item.label
      const mnemonicWord = elementLabel.split('.')[1]?.replace(' ', '') ?? ''
      const mnemonicNum = elementLabel.split('.')[0]?.replace('.', '') ?? ''
      mnemonicWordIndexArray.push({ mnemonicNum, mnemonicWord })
    })
    return mnemonicWordIndexArray
  }

  // Creates an object of all of the recovery phrase words with an index
  async mnemonicWordsObject() {
    let mnemonicWordIndexArray = []
    if (device.getPlatform() === 'android') {
      mnemonicWordIndexArray = await this.getAndroidWordsObject()
    } else {
      mnemonicWordIndexArray = await this.getIosWordsObject()
    }

    const mnemonicMapped = mnemonicWordIndexArray.map(item => ({
      [item.mnemonicNum]: item.mnemonicWord
    }))
    return Object.assign({}, ...mnemonicMapped)
  }

  async verifyNewRecoveryPhrasePage() {
    await Assert.isVisible(this.newRecoveryPhraseTitle)
    await Assert.isVisible(this.newRecoveryPhraseContent)
    await Assert.isVisible(this.iWroteItDownBtn)
  }

  async verifyCopyPhraseModal() {
    await this.tapCopyPhrase()
    await Assert.isVisible(this.securityWarningTitle)
    await Assert.isVisible(this.securityWarningContent)
    await Action.tap(this.copyAnyway)
    await Assert.isVisible(this.copied)

    await this.tapCopyPhrase()
    await Action.tap(this.cancel)
    await Assert.isNotVisible(this.copied)
  }

  async verifyProtectYourFundsModal() {
    await Action.waitForElement(this.iUnderstandBtn)
    await Assert.isVisible(this.protectFundsModalBackBtn)
    await Assert.isVisible(this.protectFundsModalMsg)
    await Assert.isVisible(this.protectFundsModalTitle)
    await this.tapIUnderstandBtn()
  }
}
export default new NewRecoveryPhrasePage()
