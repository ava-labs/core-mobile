/* eslint-disable @typescript-eslint/no-explicit-any */
import Action from '../helpers/actions'
import Assert from '../helpers/assertions'
import Collectibles from '../locators/collectibles.loc'
import AccountManagePage from './accountManage.page'
import popUpModalPage from './popUpModal.page'

class CollectiblesPage {
  get sendButton() {
    return by.id(Collectibles.sendButton)
  }

  get saveBtn() {
    return by.text(Collectibles.saveBtn)
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

  get customFeeButton() {
    return by.text(Collectibles.customFeeButton)
  }

  get customFeeInput() {
    return by.id(Collectibles.customFeeInput)
  }

  get nftlogo() {
    return by.id(Collectibles.nftlogo)
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
    return by.text(Collectibles.transactionDetails)
  }

  get warningAddressRequired() {
    return by.text(Collectibles.warningAddressRequired)
  }

  get warningInsufficientFee() {
    return by.text(Collectibles.warningInsufficientFee)
  }

  get warningGasLimitIsInvalid() {
    return by.text(Collectibles.warningGasLimitIsInvalid)
  }

  get listSvg() {
    return by.id(Collectibles.listSvg)
  }

  get invalidNFT() {
    return by.text(Collectibles.invalidNFT)
  }

  get nftItem() {
    return by.id(Collectibles.nftItem)
  }

  get testingNft() {
    return by.text(Collectibles.testingNft)
  }

  get nftListView() {
    return by.id(Collectibles.nftListView)
  }

  async tapSaveButton() {
    await Action.tapElementAtIndex(this.saveBtn, 0)
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

  async tapListSvg() {
    await Action.tapElementAtIndex(this.listSvg, 0)
  }

  async tapInvalidNFT() {
    await Action.tapElementAtIndex(this.invalidNFT, 0)
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

    return result.text.toLowerCase()
  }

  async scrollToMintNFT() {
    await Action.scrollListUntil(this.testingNft, this.nftListView, 300)
  }

  async tapMintNFT() {
    await Action.tap(this.nftItem.withDescendant(by.text('mint')))
  }

  async tapMyAccounts() {
    await Action.tapElementAtIndex(this.myAccounts, 0)
  }

  async tapNextButton() {
    await Action.tapElementAtIndex(this.nextButton, 0)
  }

  async refreshCollectiblesPage() {
    await Action.swipeDown(by.id('baseGridItem'), 'slow', 0.75, 0)
  }

  async scrollToNftDetailsItems() {
    await Action.swipeUp(by.id('send_btn'), 'slow', 0.75, 0)
  }

  async verifyNftDetailsItems() {
    await this.scrollToNftDetailsItems()
    await Assert.isVisible(this.descriptionTitle)
    await Assert.isVisible(this.createdByTitle)
    await Assert.isVisible(this.floorPriceTitle)
  }

  async sendNft(account: string) {
    await this.tapSendButton()
    await this.tapAddressBook()
    await this.tapMyAccounts()
    account === 'second'
      ? await AccountManagePage.tapFirstAccount()
      : await AccountManagePage.tapSecondAccount()
    await this.tapNextButton()
    await popUpModalPage.verifyApproveTransactionItems()
    await popUpModalPage.tapApproveBtn()
  }

  async inputCustomFee() {
    await Action.setInputText(this.customFeeInput, '25000000', 1)
    await Action.setInputText(this.customFeeInput, '1000', 3)
    await this.tapSaveButton()
    await popUpModalPage.tapApproveBtn()
  }
}

export default new CollectiblesPage()
