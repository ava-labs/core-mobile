/* eslint-disable @typescript-eslint/no-explicit-any */

import { expect, element } from 'detox'
import { Platform } from './constants'
import Constants from './constants'
import Actions from './actions'

const isVisible = async (item: Detox.NativeMatcher, num = 0) => {
  await expect(element(item).atIndex(num)).toBeVisible()
}

const isVisibleNoSync = async (item: Detox.NativeMatcher, num = 0) => {
  if (Actions.platform() === Platform.Android) {
    try {
      await expect(element(item).atIndex(num)).toBeVisible()
    } catch (error: any) {
      if (error.message === Constants.idleTimeoutError) {
        console.error(Constants.animatedConsoleError)
      } else {
        throw error
      }
    }
  } else {
    await expect(element(item).atIndex(num)).toBeVisible()
  }
}

const isNotVisible = async (item: Detox.NativeMatcher) => {
  await expect(element(item)).not.toBeVisible()
}

const hasText = async (item: Detox.NativeMatcher, text: string) => {
  await expect(element(item)).toHaveText(text)
}

export default {
  isVisible,
  isVisibleNoSync,
  isNotVisible,
  hasText
}
