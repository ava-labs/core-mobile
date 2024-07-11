/* eslint-disable @typescript-eslint/no-explicit-any */

import assert from 'assert'
import { expect, element } from 'detox'
import { Platform } from './constants'
import Constants from './constants'
import Actions from './actions'

const isVisible = async (item: Detox.NativeMatcher, num = 0) => {
  await expect(element(item).atIndex(num)).toBeVisible()
}

// isVisibleNoSync function can be used to handle idle timeout error for Android devices, should be used only if Idle timeout error presents
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

const isNotVisible = async (item: Detox.NativeMatcher, index = 0) => {
  await expect(element(item).atIndex(index)).not.toBeVisible()
}

const hasText = async (item: Detox.NativeMatcher, text: string) => {
  await expect(element(item)).toHaveText(text)
}

const hasValue = async (item: Detox.NativeMatcher, value: string) => {
  await expect(element(item)).toHaveValue(value)
}

const count = async (item: Detox.NativeMatcher, value: number) => {
  const eles = await element(item).getAttributes()
  let curr = 1
  if ('elements' in eles) {
    curr = eles.elements.length
  }
  assert(curr === value, `currCount(${curr}) != expectedCount${value} `)
}

export default {
  isVisible,
  isVisibleNoSync,
  isNotVisible,
  hasText,
  hasValue,
  count
}
