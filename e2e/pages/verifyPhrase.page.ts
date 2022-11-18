import Action from '../helpers/actions'
import verifyPhraseLoc from '../locators/verifyPhrase.loc'
import delay from '../helpers/waits'

class VerifyPhrasePage {
  get selectWord() {
    return by.id(verifyPhraseLoc.selectWord)
  }

  get verifyPhraseBtn() {
    return by.id(verifyPhraseLoc.verifyPhraseBtn)
  }

  // Converts the index of the word to the actual word number in the recovery phrase and returns an array of 3 words to tap on the confirmation page
  async selectWordNumbers(recoveryPhraseObject: object) {
    const attributes = await Action.getAttributes(this.selectWord)
    // @ts-ignore
    const elementArray = attributes.elements

    const wordNumberArray: string | string[] = []

    elementArray.forEach((item: { text: string }) => {
      const wordPrompt = item.text
      const wordNumber = wordPrompt.split('#')[1]
      if (wordNumber) {
        wordNumberArray.push(wordNumber)
      }
    })

    const wordsToConfirm: string[] = []

    wordNumberArray.forEach(myWordNumber => {
      const confirmationWord =
        recoveryPhraseObject[myWordNumber as keyof typeof recoveryPhraseObject]
      wordsToConfirm.push(confirmationWord)
    })
    return wordsToConfirm
  }

  async tapWordsToConfirm(wordsToConfirm: string[]) {
    for (let i = 0; i < wordsToConfirm.length; i++) {
      const word = wordsToConfirm[i]
      if (!word) {
        console.error('Word i undefined')
        continue
      }
      try {
        await element(by.text(word)).tap()
        await delay(500)
      } catch (error) {
        console.log('More than one element found trying another index...')
        if (i === 0) {
          await element(by.text(word)).atIndex(0).tap()
          await delay(500)
        } else if (i === 1) {
          await element(by.text(word)).atIndex(1).tap()
          await delay(500)
        } else if (i === 2) {
          await element(by.text(word)).atIndex(1).tap()
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
