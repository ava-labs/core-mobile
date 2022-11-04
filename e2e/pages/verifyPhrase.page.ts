import Action from '../helpers/actions'
import verifyPhraseLoc from '../locators/verifyPhrase.loc'
import delay from '../helpers/waits'

class VerifyPhrasePage {
  /*
   This object is used to convert the index of the recover phrase object to the actual number of the word in the recovery phrase so the test can tap the correct words on the confirmation page. 
   This is done because Detox grabs the words in a different order than the recovery phrase.  
  */
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

  // Converts the index of the word to the actual word number in the recovery phrase and returns an array of 3 words to tap on the confirmation page
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
      const confirmationWord = recoveryPhraseObject[`${myWordNumber}`]
      wordsToConfirm.push(confirmationWord)
    })

    console.log(wordsToConfirm)

    return wordsToConfirm
  }

  async tapWordsToConfirm(wordsToConfirm: string[]) {
    for (let i = 0; i < wordsToConfirm.length; i++) {
      try {
        await element(by.text(wordsToConfirm[i])).tap()
        await delay(500)
      } catch (error) {
        console.log('More than one element found trying another index...')
        if (i === 0) {
          await element(by.text(wordsToConfirm[i])).atIndex(0).tap()
          await delay(500)
        } else if (i === 1) {
          await element(by.text(wordsToConfirm[i])).atIndex(1).tap()
          await delay(500)
        } else if (i === 2) {
          await element(by.text(wordsToConfirm[i])).atIndex(1).tap()
          await delay(500)
        }
      }
    }
  }

  async tapVerifyPhraseBtn() {
    return Action.tap(this.verifyPhraseBtn)
  }
}

export default new VerifyPhrasePage()
