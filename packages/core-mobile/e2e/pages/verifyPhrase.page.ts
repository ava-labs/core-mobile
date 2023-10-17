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

  get firstMnemonicWord() {
    return by.id(verifyPhraseLoc.firstWord)
  }

  get secondMnemonicWord() {
    return by.id(verifyPhraseLoc.secondWord)
  }

  get thirdMnemonicWord() {
    return by.id(verifyPhraseLoc.thirdWord)
  }

  get instructions() {
    return by.id(verifyPhraseLoc.instructions)
  }

  get title() {
    return by.id(verifyPhraseLoc.title)
  }

  async getAndroidWordNumbers() {
    const attsArray = []
    for (let i = 0; i < 3; i++) {
      const atts = element(this.selectWord).atIndex(i)
      const getAtts = await atts.getAttributes()
      attsArray.push(getAtts)
    }
    return attsArray
  }

  async getIosWordNumbers() {
    const atts = await Action.getAttributes(this.selectWord)
    // @ts-ignore
    return atts.elements
  }

  async determinePlatformArray() {
    if (device.getPlatform() === 'android') {
      return await this.getAndroidWordNumbers()
    } else {
      return await this.getIosWordNumbers()
    }
  }

  // Converts the index of the word to the actual word number in the recovery phrase and returns an array of 3 words to tap on the confirmation page
  async selectWordNumbers(recoveryPhraseObject: object) {
    const elementArray = await this.determinePlatformArray()

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
        console.log(word + ' this is the word thats tapped!!!')
        await delay(500)
      } catch (error) {
        console.log('More than one element found trying another index...')
        if (i === 0) {
          await element(by.text(word)).atIndex(0).tap()
          await delay(500)
        } else if (i === 1 || i === 2) {
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
