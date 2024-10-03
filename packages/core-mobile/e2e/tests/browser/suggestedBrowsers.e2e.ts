import { SUGGESTED_ITEMS } from 'store/browser/const'
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
        await actions.tap(by.text(name))
        await delay(3000)
        await browserPage.tapContinue()
        await browserPage.tapbrowserRefreshBtn()
        await wbs.verifyUrl(urls[index])
        await browserPage.tapBrowserBackBtn()
        console.log(`done testing for ${name}`)
      }
    }
  })
})
