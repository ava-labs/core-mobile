import { actions } from '../../helpers/actions'
import warmup from '../../helpers/warmup'
import browserPage from '../../pages/browser.page'
import bottomTabsPage from '../../pages/bottomTabs.page'

async function addTabs(count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await browserPage.tapAddTab()
    if (i < count - 1) {
      await actions.delay(800) // allow navigation and panel to render
      await browserPage.tapTabsButton()
      await actions.delay(500) // allow tabs panel to open
    }
  }
}

describe('Browser tab', () => {
  before(async () => {
    await warmup()
  })

  it('[Smoke] should open Browser tab and show Discover', async () => {
    await bottomTabsPage.tapBrowserTab()
    await browserPage.verifyDiscoverVisible()
  })

  it('should show History empty state when no history', async () => {
    await bottomTabsPage.tapBrowserTab()
    await browserPage.verifyDiscoverVisible()
    await browserPage.tapTabsButton()
    await browserPage.verifyTabsPanelVisible()
    await browserPage.tapTabsMenuTrigger()
    await browserPage.tapBrowsingHistory()
    await browserPage.verifyHistoryScreenVisible()
    await browserPage.verifyHistoryEmptyMessage()
  })

  it('should open Tabs panel', async () => {
    await bottomTabsPage.tapBrowserTab()
    await browserPage.verifyDiscoverVisible()
    await browserPage.tapTabsButton()
    await browserPage.verifyTabsPanelVisible()
  })

  it('should navigate to URL and show webview', async () => {
    await bottomTabsPage.tapBrowserTab()
    await browserPage.verifyDiscoverVisible()
    await browserPage.tapUrlBar()
    await browserPage.typeUrl('https://example.com')
    await browserPage.submitUrl()
    await browserPage.verifyUrlContains('example.com')
  })

  it('should close webview and return to Discover', async () => {
    await browserPage.tapTabsButton()
    await browserPage.tapTabsMenuTrigger()
    await browserPage.tapCloseAllTabs()
    await browserPage.tapCloseAllTabsConfirm()
    await browserPage.verifyDiscoverVisible()
  })

  it('should show visited URL in History', async () => {
    await browserPage.tapUrlBar()
    await browserPage.typeUrl('https://example.com')
    await browserPage.submitUrl()
    await browserPage.verifyUrlContains('example.com')
    await browserPage.tapTabsButton()
    await browserPage.tapTabsMenuTrigger()
    await browserPage.tapCloseAllTabs()
    await browserPage.tapCloseAllTabsConfirm()
    await browserPage.verifyDiscoverVisible()
    await browserPage.tapTabsButton()
    await browserPage.tapTabsMenuTrigger()
    await browserPage.tapBrowsingHistory()
    await browserPage.verifyHistoryContainsText('example.com')
  })

  it('should close all tabs and return to Discover', async () => {
    await bottomTabsPage.tapBrowserTab()
    await browserPage.verifyDiscoverVisible()
    await browserPage.tapUrlBar()
    await browserPage.typeUrl('https://example.com')
    await browserPage.submitUrl()
    await browserPage.verifyUrlContains('example.com')
    await browserPage.tapTabsButton()
    await addTabs(10)
    await browserPage.tapTabsButton()
    await browserPage.tapTabsMenuTrigger()
    await browserPage.tapCloseAllTabs()
    await browserPage.tapCloseAllTabsConfirm()
    await browserPage.verifyDiscoverVisible()
  })
})
