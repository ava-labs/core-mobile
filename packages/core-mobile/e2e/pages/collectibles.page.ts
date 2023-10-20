/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect as jestExpect } from 'expect'
import Action from '../helpers/actions'
import Assert from '../helpers/assertions'
import Collectibles from '../locators/collectibles.loc'
import { Platform } from '../helpers/constants'
import AccountManagePage from './accountManage.page'

class CollectiblesPage {
  get sendButton() {
    return by.id(Collectibles.sendButton)
  }

  get gridItem() {
    return by.id(Collectibles.gridItem)
  }

  get addressBook() {
    return by.id(Collectibles.addressBook)
  }

  get addressInput() {
    return by.id(Collectibles.addressInput)
  }

  get fromText() {
    return by.text(Collectibles.fromText)
  }

  get toText() {
    return by.text(Collectibles.toText)
  }

  get networkFeeText() {
    return by.text(Collectibles.networkFeeText)
  }

  get sendTitle() {
    return by.text(Collectibles.sendTitle)
  }

  get collectibleText() {
    return by.text(Collectibles.collectibleText)
  }

  get customFeeButton() {
    return by.text(Collectibles.customFeeButton)
  }

  get customFeeInput() {
    return by.id(Collectibles.customFeeInput)
  }

  get nftlogo() {
    return by.id(Collectibles.nftlogo)
  }

  get cancelButton() {
    return by.id(Collectibles.cancelButton)
  }

  get networkFee() {
    return by.text(Collectibles.networkFeeText)
  }

  get myAccounts() {
    return by.text(Collectibles.myAccounts)
  }

  get nextButton() {
    return by.id(Collectibles.nextButton)
  }

  get nftTokenId() {
    return by.id(Collectibles.nftTokenId)
  }

  get nftTokenName() {
    return by.id(Collectibles.nftTokenName)
  }

  get nftTokenTitle() {
    return by.id(Collectibles.nftTokenTitle)
  }

  get sendNowButton() {
    return by.id(Collectibles.sendNowButton)
  }

  get sendSuccessfulToastMsg() {
    return by.text(Collectibles.sendSuccessfulToastMsg)
  }

  get descriptionTitle() {
    return by.text(Collectibles.descriptionTitle)
  }

  get createdByTitle() {
    return by.text(Collectibles.createdByTitle)
  }

  get floorPriceTitle() {
    return by.text(Collectibles.floorPriceTitle)
  }

  get propertiesTitle() {
    return by.text(Collectibles.propertiesTitle)
  }

  get warningAddressRequired() {
    return by.text(Collectibles.warningAddressRequired)
  }

  get warningInsufficientFee() {
    return by.text(Collectibles.warningInsufficientFee)
  }

  async tapAddressBook() {
    await Action.tapElementAtIndex(this.addressBook, 0)
  }

  async tapCustomFeeButton() {
    await Action.tapElementAtIndex(this.customFeeButton, 0)
  }

  async tapGridItem() {
    await Action.tapElementAtIndex(this.gridItem, 0)
  }

  async tapSendButton() {
    await Action.tapElementAtIndex(this.sendButton, 0)
  }

  async getTextValue(pageElement: string) {
    const atr =
      pageElement === 'nftTokenId'
        ? this.nftTokenId
        : pageElement === 'nftTokenName'
        ? this.nftTokenName
        : pageElement === 'nftTokenTitle'
        ? this.nftTokenTitle
        : null

    const result: any = await Action.getAttributes(atr, 0)

    return Action.platform() === Platform.Android
      ? result.text.toLowerCase()
      : result.elements[0].text.toLowerCase()
  }

  async tapMyAccounts() {
    await Action.tapElementAtIndex(this.myAccounts, 0)
  }

  async tapNextButton() {
    await Action.tapElementAtIndex(this.nextButton, 0)
  }

  async tapSendNowButton() {
    await Action.tapElementAtIndex(this.sendNowButton, 0)
  }

  async refreshCollectiblesPage() {
    await Action.swipeDown(by.id('baseGridItem'), 'slow', 0.75, 0)
  }

  async scrollToNftDetailsItems() {
    await Action.swipeUp(by.id('btnSecondary'), 'slow', 0.75, 0)
  }

  async verifyReceiveNftToken(nftTokenId: string) {
    const ReceivedNftTokenId = await this.getTextValue('nftTokenId')
    const result = nftTokenId === ReceivedNftTokenId ? true : false

    jestExpect(result).toBe(true)
  }

  async verifyNftDetailsItems() {
    await this.scrollToNftDetailsItems()
    await Assert.isVisible(this.descriptionTitle)
    await Assert.isVisible(this.createdByTitle)
    await Assert.isVisible(this.floorPriceTitle)
    await Assert.isVisible(this.propertiesTitle)
  }

  async verifySendNftItems() {
    await Assert.isVisible(this.fromText)
    await Assert.isVisible(this.toText)
    await Assert.isVisible(this.networkFeeText)
    await Assert.isVisible(this.sendTitle)
    await Assert.isVisible(this.collectibleText)
    await Assert.isVisible(this.nftlogo)
    await Assert.isVisible(this.networkFee)
    await Assert.isVisible(this.sendNowButton)
    await Assert.isVisible(this.cancelButton)
  }

  async sendNft(account: string, nftTokenId: any = null) {
    let result
    await this.tapSendButton()
    if (account === 'first') {
      await this.verifyReceiveNftToken(nftTokenId)
    }
    await this.tapAddressBook()
    await this.tapMyAccounts()
    account === 'first'
      ? await AccountManagePage.tapFirstAccount()
      : (await AccountManagePage.tapSecondAccount(),
        (result = await this.getTextValue('nftTokenId')))
    await this.tapNextButton()
    await this.verifySendNftItems()
    await this.tapSendNowButton()
    return result
  }

  async inputCustomFee() {
    await Action.setInputText(this.customFeeInput, '25000000', 1)
    await Action.tap(this.sendTitle)
  }
}

export default new CollectiblesPage()
