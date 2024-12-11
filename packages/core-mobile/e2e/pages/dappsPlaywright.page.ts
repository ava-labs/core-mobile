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
    return 'https://lfj.gg/avalanche'
  }

  get uniswapUrl() {
    return 'https://app.uniswap.org/#/swap'
  }

  get yieldYakUrl() {
    return 'https://www.yieldyak.com/'
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
}

export default DappsPlaywrightPage
