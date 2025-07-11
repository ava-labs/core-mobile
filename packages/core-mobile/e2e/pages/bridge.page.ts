import Actions from '../helpers/actions'
import Assert from '../helpers/assertions'
import delay from '../helpers/waits'
import bridgeTab from '../locators/bridgeTab.loc'
import commonElsLoc from '../locators/commonEls.loc'
import BottomTabsPage from './bottomTabs.page'
import commonElsPage from './commonEls.page'
import PlusMenuPage from './plusMenu.page'
import portfolioPage from './portfolio.page'
import PortfolioPage from './portfolio.page'
import selectTokenPage from './selectToken.page'
import swapTabPage from './swapTab.page'

class BridgePage {
  get closebutton() {
    return by.text(bridgeTab.closebutton)
  }

  get fromText() {
    return by.text(bridgeTab.from)
  }

  get bridgeTitle() {
    return by.text(bridgeTab.bridgeTitle)
  }

  get bridgeBtn() {
    return by.id(bridgeTab.bridgeBtn)
  }

  get receive() {
    return by.text(bridgeTab.receive)
  }

  get bridgeToggleBtn() {
    return by.id(bridgeTab.bridgeToggleBtn)
  }

  get selectedToken() {
    return by.id(bridgeTab.selectedToken)
  }

  get toNetwork() {
    return by.id(bridgeTab.toNetwork)
  }

  get fromNetwork() {
    return by.text(bridgeTab.fromNetwork)
  }

  get hollidayBannerTitle() {
    return by.text(bridgeTab.hollidayBannerTitle)
  }

  get hollidayBannerWebView() {
    return by.id(bridgeTab.hollidayBannerWebView)
  }

  get hollidayBannerContent() {
    return by.text(bridgeTab.hollidayBannerContent)
  }

  async tapBridgeToggleBtn() {
    await Actions.tap(this.bridgeToggleBtn)
  }

  async tapClose() {
    await Actions.tap(this.closebutton)
  }

  async verifyBridgeScreen() {
    await Actions.waitForElement(this.bridgeTitle)
    await Assert.isVisible(this.bridgeBtn)
    await Assert.isVisible(this.fromText)
    await Assert.isVisible(this.receive)
    await Assert.isVisible(this.bridgeToggleBtn)
  }

  async tapFromNetwork() {
    await Actions.tap(this.fromNetwork)
  }

  async tapSelectToken() {
    await delay(1000)
    await Actions.tap(this.selectedToken)
  }

  async verifyFromNetwork(network: string) {
    await Assert.hasText(this.fromNetwork, network, 0)
  }

  async verifyNetworks(from: string, to: string) {
    await this.verifyFromNetwork(from)
    await this.verifyToNetwork(to)
  }

  async verifyToNetwork(network = '') {
    await Assert.isVisible(this.toNetwork)
    await Assert.hasText(this.toNetwork, network, 0)
  }
  // eslint-disable-next-line max-params
  async verifyBridgeTransaction(
    timeout: number,
    completedStatusIncomingNetwork: Detox.NativeMatcher,
    completedStatusOutgoingNetwork: Detox.NativeMatcher,
    successfullBridgeTransaction: Detox.NativeMatcher
  ) {
    await Actions.waitForElementNoSync(this.closebutton, timeout)
    await Assert.isVisible(completedStatusIncomingNetwork)
    await Assert.isVisible(completedStatusOutgoingNetwork)

    await this.tapClose()
    await PortfolioPage.tapAvaxNetwork()
    await PortfolioPage.tapActivityTab()
    await Assert.isVisible(successfullBridgeTransaction)
  }

  async goToBridge() {
    await BottomTabsPage.tapPlusIcon()
    await PlusMenuPage.tapBridgeButton()
  }

  async verifyHollidayBanner() {
    await Actions.waitForElement(this.hollidayBannerTitle)
    await Actions.waitForElement(this.hollidayBannerContent)
  }

  async tapHollidayBanner() {
    await Actions.tap(this.hollidayBannerTitle)
    await Actions.waitForElement(this.hollidayBannerWebView)
  }

  async verifyApprovePopup(
    accountAddress: string,
    tokenAddress: string,
    network: string
  ) {
    try {
      await Actions.waitForElement(commonElsPage.approvePopupSpendTitle, 10000)
    } catch (e) {
      await Actions.waitForElement(commonElsPage.approvePopupTitle, 10000)
    }
    await Assert.isVisible(by.id(`address__${accountAddress}`))
    await Assert.isVisible(by.id(`address__${tokenAddress}`))
    await Assert.isVisible(by.id(`network__${network}`))
    await Assert.isVisible(commonElsPage.approveButton)
    await Assert.isVisible(commonElsPage.rejectButton)
  }

  // eslint-disable-next-line max-params
  async bridge(
    network: string,
    token: string,
    amount: string,
    tokenAddress: string,
    fromAddress = commonElsLoc.myEvmAddress2,
    completeProcess = false
  ) {
    // Go to Bridge
    await portfolioPage.tapBridge()
    await commonElsPage.dismissTransactionOnboarding()

    // Select From Network
    if (network !== commonElsLoc.cChain_2) {
      await this.tapFromNetwork()
      await Actions.tapElementAtIndex(by.id(`select_network__${network}`), 0)
    }

    // Select From Token
    if (await Actions.expectToBeVisible(swapTabPage.selectTokenTitle)) {
      await swapTabPage.tapSelectToken()
      await selectTokenPage.selectToken(token)
    }

    // Enter Amount
    await commonElsPage.enterAmount(amount)
    await Actions.tapElementAtIndex(this.bridgeTitle, 0)

    // proceed the bridge
    if (await Actions.expectToBeVisible(commonElsPage.insufficientBalance)) {
      await commonElsPage.dismissBottomSheet()
    } else {
      await commonElsPage.tapNextButton()
      await this.verifyApprovePopup(fromAddress, tokenAddress, network)

      // Approve or Reject. The default is to and we can change it to approve if needed.
      if (completeProcess) {
        await commonElsPage.tapApproveButton()
        await commonElsPage.verifySuccessToast()
      } else {
        await commonElsPage.tapRejectButton()
        await commonElsPage.dismissBottomSheet()
      }
    }
  }
}

export default new BridgePage()
