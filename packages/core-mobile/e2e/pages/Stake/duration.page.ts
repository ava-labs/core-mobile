// import Actions from '../../helpers/actions'
import DurationScreenLoc from '../../locators/Stake/durationScreen.loc'
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'

class DurationPage {
  get advancedSetup() {
    return by.text(DurationScreenLoc.advancedSetup)
  }

  get disclaimerText() {
    return by.text(DurationScreenLoc.disclaimerText)
  }

  get disclaimerTooltip() {
    return by.id(DurationScreenLoc.disclaimerTooltip)
  }

  get tooltipText() {
    return by.text(DurationScreenLoc.tooltipText)
  }

  get tooltipTextLink() {
    return by.text(DurationScreenLoc.tooltipTextLink)
  }

  get durationTitle() {
    return by.text(DurationScreenLoc.durationTitle)
  }

  get durationDescription() {
    return by.text(DurationScreenLoc.durationDescription)
  }

  get nextButton() {
    return by.id(DurationScreenLoc.nextButton)
  }

  get oneDayText() {
    return by.text(DurationScreenLoc.oneDayText)
  }

  get twoWeeksText() {
    return by.text(DurationScreenLoc.twoWeeksText)
  }

  get oneMonthText() {
    return by.text(DurationScreenLoc.oneMonthText)
  }

  get threeMonthsText() {
    return by.text(DurationScreenLoc.threeMonthsText)
  }

  get sixMonthsText() {
    return by.text(DurationScreenLoc.sixMonthsText)
  }

  get oneYearText() {
    return by.text(DurationScreenLoc.oneYearText)
  }

  get customText() {
    return by.text(DurationScreenLoc.customText)
  }

  get customDescription() {
    return by.text(DurationScreenLoc.customDescription)
  }

  async tapDisclaimerTooltip() {
    await Actions.tap(this.disclaimerTooltip)
  }

  async verifyDurationScreenItems(devnet: boolean) {
    await Actions.waitForElement(this.durationDescription, 30000)
    await Assert.isVisible(this.durationTitle)
    await Assert.isVisible(this.durationDescription)
    await Assert.isVisible(this.nextButton, 0)
    devnet === true
      ? await Assert.isVisible(this.oneDayText)
      : await Assert.isVisible(this.twoWeeksText)
    await Assert.isVisible(this.oneMonthText)
    await Assert.isVisible(this.threeMonthsText)
    await Assert.isVisible(this.sixMonthsText)
    await Assert.isVisible(this.oneYearText)
    await Assert.isVisible(this.customText)
    await Assert.isVisible(this.customDescription)
    await Assert.isVisible(this.disclaimerTooltip)
    await Assert.isVisible(this.advancedSetup)
  }
}

export default new DurationPage()
