import { expect, element } from 'detox'

const isVisible = async (item: Detox.NativeMatcher, num = 0) => {
  await expect(element(item).atIndex(num)).toBeVisible()
}

const isNotVisible = async (item: Detox.NativeMatcher) => {
  await expect(element(item)).not.toBeVisible()
}

const hasText = async (item: Detox.NativeMatcher, text: string) => {
  await expect(element(item)).toHaveText(text)
}

export default {
  isVisible,
  isNotVisible,
  hasText
}
