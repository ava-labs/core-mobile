import { Page } from '@playwright/test'

class DappsPlaywrightPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get aaveUrl() {
    return 'https://app.aave.com/'
  }

  get balancerUrl() {
    return 'https://balancer.fi/pools'
  }

  get benqiUrl() {
    return 'https://app.benqi.fi/markets'
  }

  get compoundFinanceUrl() {
    return 'https://app.compound.finance/'
  }

  get convexFinanceUrl() {
    return 'https://www.convexfinance.com/'
  }

  get gmxUrl() {
    return 'https://app.gmx.io/#/trade'
  }

  get instadappUrl() {
    return 'https://lite.instadapp.io/'
  }

  get gogoPoolUrl() {
    return 'https://app.gogopool.com/liquid-staking/'
  }

  get oasisUrl() {
    return 'https://summer.fi/'
  }

  get openseaUrl() {
    return 'https://opensea.io/'
  }

  get pangolinUrl() {
    return 'https://beta.pangolin.exchange/swap'
  }

  get stakeLidoUrl() {
    return 'https://stake.lido.fi/'
  }

  get lfjUrl() {
    return 'https://lfj.gg/avalanche/trade'
  }

  get uniswapUrl() {
    return 'https://app.uniswap.org/#/swap'
  }

  get sushiswapUrl() {
    return 'https://www.sushi.com/avalanche/swap'
  }

  get yieldYakUrl() {
    return 'https://www.yieldyak.com/avalanche/swap'
  }

  get salvorUrl() {
    return 'https://salvor.io/'
  }

  get steakHutUrl() {
    return 'https://app.steakhut.finance/liquidity'
  }

  get pharaohUrl() {
    return 'https://pharaoh.exchange/swap'
  }

  get salvorXbtn() {
    return this.page.locator('div[class="close-modal"]')
  }

  get steakHutXBtn() {
    return this.page.locator('text="Enter SteakHut"')
  }

  get lidoAgree() {
    return this.page.getByText(
      'I certify that I have read and accept the updated'
    )
  }

  get pangolinAgree() {
    return this.page.locator('#agree')
  }

  get lfjAgree() {
    return this.page.locator('text="I read and accept"')
  }

  get lfjFromAmount() {
    return this.page.locator('input[data-cy="trade-currency-input"]')
  }

  get lfjToSelectToken() {
    return this.page.locator('(//button[@data-cy="currency-picker-button"])[2]')
  }

  get lfjSelectTokenSearchBar() {
    return this.page.locator('//input[@data-cy="currency-picker-search-bar"]')
  }

  get lfjJoeToken() {
    return this.page.locator('//div[@data-cy="token-item-JOE"]')
  }

  get lfjSwap() {
    return this.page.locator('//button[@data-cy="swap-button"]')
  }

  get yakFromAmount() {
    return this.page.locator('input[id="amount-in"]')
  }

  get yakSwap() {
    return this.page.locator('//button[text()="Swap"]')
  }

  get sushiFromAmount() {
    return this.page.locator('input[testdata-id="swap-from-input"]')
  }

  get sushiSecondSwapBtn() {
    return this.page.locator('button[testdata-id="confirm-swap-button"]')
  }

  get sushiFirstSwapBtn() {
    return this.page.locator('button[testdata-id="swap-button"]')
  }

  get sushiSwitchToCChainBtn() {
    return this.page.locator(
      'button[testdata-id="switch-network-43114-button"]'
    )
  }

  get sushiAcceptCookies() {
    return this.page.locator('//button[text()="Accept all cookies"]')
  }

  get uniFromToken() {
    return this.page.locator('//span[@data-testid="choose-input-token-label"]')
  }

  get uniToToken() {
    return this.page.locator('//span[@data-testid="choose-output-token-label"]')
  }

  get uniAvaxToken() {
    return this.page.locator('(//span[text()="AVAX"])[1]')
  }

  get uniUSDCToken() {
    return this.page.locator('//span[text()="USD Coin"]')
  }

  get uniSwitchToAvalanche() {
    return this.page.locator('//span[text()="Swapping on Avalanche"]')
  }

  get uniFromAmount() {
    return this.page.locator('input[data-testid="amount-input-in"]')
  }

  get uniReviewBtn() {
    return this.page.locator('//span[text()="Review"]')
  }

  get uniSwap() {
    return this.page.locator(
      '//div[starts-with(@id, "content-")]//span[text()="Swap"]'
    )
  }

  get uniConfirmInWallet() {
    return this.page.locator('//span[text()="Confirm in wallet"]')
  }
}

export default DappsPlaywrightPage
