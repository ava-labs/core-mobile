import Actions from '../../helpers/actions'
import getStartedScreenLoc from '../../locators/Stake/getStartedScreen.loc'
import Assert from '../../helpers/assertions'

class GetStartedScreenPage {
  get avaLogo() {
    return by.id(getStartedScreenLoc.avaLogo)
  }

  get disclaimerTitle() {
    return by.text(getStartedScreenLoc.disclaimerTitle)
  }

  get disclaimerTextItem1() {
    return by.text(getStartedScreenLoc.disclaimerTextItem1)
  }

  get disclaimerTextItem2() {
    return by.text(getStartedScreenLoc.disclaimerTextItem2)
  }

  get disclaimerTextItem3() {
    return by.text(getStartedScreenLoc.disclaimerTextItem3)
  }

  get getStartedTitle() {
    return by.text(getStartedScreenLoc.getStartedTitle)
  }

  get getStartedSubTitle() {
    return by.text(getStartedScreenLoc.getStartedSubTitle)
  }

  get getStartedDescription() {
    return by.text(getStartedScreenLoc.getStartedDescription)
  }

  get getStartedSubDescription() {
    return by.text(getStartedScreenLoc.getStartedSubDescription)
  }

  get getStartedItem() {
    return by.text(getStartedScreenLoc.getStartedItem1)
  }

  get getStartedItem2() {
    return by.text(getStartedScreenLoc.getStartedItem2)
  }

  get getStartedItem3() {
    return by.text(getStartedScreenLoc.getStartedItem3)
  }

  get nextButton() {
    return by.id(getStartedScreenLoc.nextButton)
  }

  get nextButtonText() {
    return by.text(getStartedScreenLoc.nextButtonText)
  }

  get disclamerText() {
    return by.text(getStartedScreenLoc.disclamerText)
  }

  async tapDisclaimerText() {
    await Actions.tapElementAtIndex(this.disclamerText, 0)
  }

  async tapNextButton() {
    await Actions.tapElementAtIndex(this.nextButton, 0)
  }

  // add verify Icons
  async verifyGetStartedScreenItems() {
    await Assert.isVisible(this.avaLogo)
    await Assert.isVisible(this.getStartedTitle)
    await Assert.isVisible(this.getStartedSubTitle)
    await Assert.isVisible(this.getStartedDescription)
    await Assert.isVisible(this.getStartedSubDescription)
    await Assert.isVisible(this.getStartedItem)
    await Assert.isVisible(this.getStartedItem2)
    await Assert.isVisible(this.getStartedItem3)
    await Assert.isVisible(this.nextButtonText)
    await Assert.isVisible(this.disclamerText)
    await Assert.isVisible(this.nextButton)
  }

  async verifyDisclaimerScreenItems() {
    await Assert.isVisible(this.disclaimerTitle)
    await Assert.isVisible(this.disclaimerTextItem1)
    await Assert.isVisible(this.disclaimerTextItem2)
    await Assert.isVisible(this.disclaimerTextItem3)
  }
}

export default new GetStartedScreenPage()
