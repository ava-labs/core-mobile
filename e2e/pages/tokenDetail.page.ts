import tokenDetail from '../locators/tokenDetail.loc'
import Assert from '../helpers/assertions'
import Action from '../helpers/actions'

class TokenDetailsPage {
  get totalSupply() {
    return by.id(tokenDetail.totalSupply)
  }

  get rank() {
    return by.id(tokenDetail.rank)
  }

  get marketCap() {
    return by.id(tokenDetail.marketCap)
  }

  get volume() {
    return by.id(tokenDetail.volume)
  }

  get availableSupply() {
    return by.id(tokenDetail.availableSupply)
  }

  get backButton() {
    return by.id(tokenDetail.backButton)
  }

  get favorite() {
    return by.id(tokenDetail.favorite)
  }

  get twitterHandle() {
    return by.id(tokenDetail.twitterHandle)
  }

  get twitterTitle() {
    return by.id(tokenDetail.twitter)
  }

  get oneWeekTab() {
    return by.text(tokenDetail.oneWeekTab)
  }

  get twentyFourHourTab() {
    return by.text(tokenDetail.twentyFourHourTab)
  }

  get oneMonthTab() {
    return by.text(tokenDetail.oneMonthTab)
  }

  get threeMonthTab() {
    return by.text(tokenDetail.threeMonthTab)
  }

  get oneYearTab() {
    return by.text(tokenDetail.oneYearTab)
  }

  async verifyTokenDetailScreen() {
    await Assert.isVisible(this.totalSupply)
    await Assert.isVisible(this.rank)
    await Assert.isVisible(this.marketCap)
    await Assert.isVisible(this.volume)
    await Assert.isVisible(this.availableSupply)
    await Assert.isVisible(this.twitterHandle)
    await Assert.isVisible(this.twitterTitle)
    await Assert.isVisible(this.twentyFourHourTab)
    await Assert.isVisible(this.oneWeekTab)
    await Assert.isVisible(this.oneMonthTab)
    await Assert.isVisible(this.threeMonthTab)
    await Assert.isVisible(this.oneYearTab)
  }

  async tapFavorite() {
    await Action.tapElementAtIndex(this.favorite, 1)
  }

  async tapBackButton() {
    await Action.tapElementAtIndex(this.backButton, 0)
  }
}

export default new TokenDetailsPage()
