import { test, Page, Browser } from '@playwright/test'
const { chromium } = require('playwright-extra')
const stealth = require('puppeteer-extra-plugin-stealth')()
chromium.use(stealth)

export const warmupWeb = async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    permissions: ['clipboard-read']
  })
  const page = await context.newPage()
  return { browser, page }
}

export const playwrightSetup = () => {
  let browser: Browser | null = null
  let page: Page | null = null

  test.beforeAll(async () => {
    const context = await warmupWeb()
    browser = context.browser
    page = context.page
    console.log('Starting Playwright test...')
  })

  test.afterAll(async () => {
    if (browser) {
      await browser.close()
      browser = null
      page = null
    }
    console.log('Closing Playwright test...')
  })

  return () => {
    if (page !== null && browser !== null) {
      return { browser, page }
    } else {
      throw new Error('Page is not initialized or invalid type.')
    }
  }
}
