import { Page, Browser, BrowserContext } from '@playwright/test'
import PlaygroundPlaywrightPage from '../pages/playgroundPlaywright.page'
import CommonPlaywrightPage from '../pages/commonPlaywrightEls.page'
import DappsPlaywrightPage from '../pages/dappsPlaywright.page'
import CorePlaywrightPage from '../pages/corePlaywright.page'
const { chromium } = require('playwright-extra')
const stealth = require('puppeteer-extra-plugin-stealth')()
chromium.use(stealth)

let sharedContext: BrowserContext | null = null

export const playwrightSetup = async (saveContext = false) => {
  const browser: Browser = await chromium.launch({ headless: false })
  const context: BrowserContext = await browser.newContext({
    permissions: ['clipboard-read']
  })
  const page: Page = await context.newPage()
  if (saveContext) {
    sharedContext = context
  }
  const playground = new PlaygroundPlaywrightPage(page)
  const common = new CommonPlaywrightPage(page)
  const dapps = new DappsPlaywrightPage(page)
  const core = new CorePlaywrightPage(page)
  return { browser, page, sharedContext, playground, common, dapps, core }
}

export const getCurrentContext = async () => {
  if (!sharedContext) {
    throw new Error(
      'sharedContext is not initialized. Ensure it is set before calling getCurrentContext.'
    )
  }
  const page = await sharedContext.newPage()
  if (!page) {
    throw new Error('Failed to create a new page.')
  }
  const playground = new PlaygroundPlaywrightPage(page)
  const common = new CommonPlaywrightPage(page)
  const dapps = new DappsPlaywrightPage(page)
  const core = new CorePlaywrightPage(page)
  return { sharedContext, page, playground, common, dapps, core }
}
