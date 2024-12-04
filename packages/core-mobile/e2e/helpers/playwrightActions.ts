/* eslint-disable @typescript-eslint/no-explicit-any */
/*eslint max-params: ["error", 4]*/
import { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
const fs = require('fs')

const tap = async (item: Locator, timeout = 5000) => {
  await expect(item.first()).toBeEnabled({ timeout })
  await item.first().click()
}

const open = async (url: string, page: Page) => {
  await page.goto(url)
  await page.setViewportSize({ width: 2080, height: 1080 })
}

const waitFor = async (item: Locator, timeout = 5000) => {
  await expect(item).toBeVisible({ timeout })
}

async function writeQrCodeToFile(clipboardValue: string) {
  fs.writeFile(
    './e2e/tests/playwright/qr_codes.txt',
    clipboardValue,
    (err: any) => {
      if (err) throw err
    }
  )
}

export default {
  tap,
  open,
  waitFor,
  writeQrCodeToFile
}
