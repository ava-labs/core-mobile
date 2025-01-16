import { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
const fs = require('fs')

const tap = async (item: Locator, timeout = 5000) => {
  await expect(item).toBeVisible({ timeout })
  await expect(item).toBeEnabled({ timeout })
  await item.click()
}

const open = async (url: string, page: Page) => {
  await page.goto(url)
}

const waitFor = async (item: Locator, timeout = 5000, visible = true) => {
  await expect(item).toBeVisible({ timeout, visible })
}

const waitForEnabled = async (item: Locator, timeout = 5000) => {
  await expect(item).toBeEnabled({ timeout })
}

async function writeQrCodeToFile(clipboardValue: string) {
  fs.writeFile(
    './e2e/tests/dapps/playwright/qr_codes.txt',
    clipboardValue,
    (err: NodeJS.ErrnoException | null) => {
      if (err) throw err
    }
  )
}

// eslint-disable-next-line max-params
function addTestResultToFile(
  testName: string,
  result: string,
  framework: string,
  path: string
) {
  const resultData = {
    testName,
    result,
    framework
  }
  const currentResults = fs.existsSync(path)
    ? JSON.parse(fs.readFileSync(path))
    : []
  currentResults.push(resultData)
  fs.writeFileSync(path, JSON.stringify(currentResults, null, 2))
}

export default {
  tap,
  open,
  waitFor,
  waitForEnabled,
  writeQrCodeToFile,
  addTestResultToFile
}
