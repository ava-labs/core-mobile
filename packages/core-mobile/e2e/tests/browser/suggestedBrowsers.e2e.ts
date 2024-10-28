import actions from '../../helpers/actions'
import { warmup } from '../../helpers/warmup'
import bottomTabsPage from '../../pages/bottomTabs.page'
import browserPage from '../../pages/browser.page'
import commonElsPage from '../../pages/commonEls.page'
import wbs from '../../helpers/web'
import delay from '../../helpers/waits'

describe('Suggested Browsers', () => {
  beforeAll(async () => {
    await warmup()
  })

  const SUGGESTED_ITEMS = [
    {
      name: 'LFJ',
      siteUrl: 'https://lfj.gg/'
    },
    {
      name: 'Yield Yak',
      siteUrl: 'https://yieldyak.com/avalanche/'
    },
    {
      name: 'GMX',
      siteUrl: 'https://app.gmx.io/#/trade'
    },
    {
      name: 'Aave',
      siteUrl: 'https://app.aave.com/'
    },
    {
      name: 'GoGoPool',
      siteUrl: 'https://www.gogopool.com/'
    },
    {
      name: 'Salvor',
      siteUrl: 'https://salvor.io/'
    },
    {
      name: 'Delta Prime',
      siteUrl: 'https://app.deltaprime.io/#/pools'
    },
    {
      name: 'The Arena',
      siteUrl: 'https://arena.social/'
    },
    {
      name: 'SteakHut',
      siteUrl: 'https://app.steakhut.finance/liquidity'
    },
    {
      name: 'Pharaoh',
      siteUrl: 'https://pharaoh.exchange/swap'
    },
    {
      name: 'Benqi',
      siteUrl: 'https://benqi.fi/'
    }
  ]
  const names: string[] = SUGGESTED_ITEMS.map(item => item.name)
  const urls: string[] = SUGGESTED_ITEMS.map(item => item.siteUrl)

  it('should have default suggested browser list', async () => {
    await bottomTabsPage.tapBrowserTab()
    await commonElsPage.tapGetStartedButton()
    await browserPage.verifySuggestedBrowserList(names)
  })

  it('should land on expected url', async () => {
    for (const [index, name] of names.entries()) {
      if (urls[index]) {
        console.log(`testing for "${name}"`)
        await actions.tap(by.text(name))
        await delay(3000)
        await browserPage.tapbrowserRefreshBtn()
        await wbs.verifyUrl(urls[index])
        await browserPage.tapBrowserBackBtn()
        console.log(`done testing for ${name}`)
      }
    }
  })
})
