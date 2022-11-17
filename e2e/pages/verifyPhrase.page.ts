import Action from '../helpers/actions'
import verifyPhraseLoc from '../locators/verifyPhrase.loc'
import delay from '../helpers/waits'

class VerifyPhrasePage {
  numberIDs = {
    1: 0,
    2: 3,
    3: 6,
    4: 9,
    5: 12,
    6: 15,
    7: 18,
    8: 21,
    9: 1,
    10: 4,
    11: 7,
    12: 10,
    13: 13,
    14: 16,
    15: 19,
    16: 22,
    17: 2,
    18: 5,
    19: 8,
    20: 11,
    21: 14,
    22: 17,
    23: 20,
    24: 23
  }
  get selectWord() {
    return by.id(verifyPhraseLoc.selectWord)
  }

  get verifyPhraseBtn() {
    return by.id(verifyPhraseLoc.verifyPhraseBtn)
  }

  async selectWordNumbers(recoveryPhraseObject: object) {
    const attributes = await Action.getAttributes(this.selectWord)
    const elementArray = attributes.elements

    const wordNumberArray: string | string[] = []

    elementArray.forEach((item: { text: string }) => {
      const wordPrompt = item.text
      const wordNumber = wordPrompt.split('#')[1]
      wordNumberArray.push(wordNumber)
    })

    const wordsToConfirm: string[] = []

    wordNumberArray.forEach(myWordNumber => {
      console.log(recoveryPhraseObject)
      const convertedWorderNumber = this.numberIDs[myWordNumber]
      const confirmationWord = recoveryPhraseObject[`${convertedWorderNumber}`]
      wordsToConfirm.push(confirmationWord)
    })

    return wordsToConfirm
  }

  async tapWordsToConfirm(wordsToConfirm: string[]) {
    for (let i = 0; i < wordsToConfirm.length; i++) {
      try {
        await element(by.text(wordsToConfirm[i])).tap()
        await delay(500)
      } catch (error) {
        console.log('More than one element found trying another index...')
        await element(by.text(wordsToConfirm[i])).atIndex(1).tap()
        await delay(500)
      }
    }
  }

  async tapVerifyPhraseBtn() {
    return Action.tap(this.verifyPhraseBtn)
  }
}

export default new VerifyPhrasePage()
