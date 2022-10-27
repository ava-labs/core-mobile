import { expect, element } from 'detox'

const isVisible = async (item, num = 0) => {
  await expect(element(item).atIndex(num)).toBeVisible()
}

const isNotVisible = async item => {
  await expect(element(item)).isNotVisible()
}

const hasText = async (item, text) => {
  await expect(element(item)).toHaveText(text)
}

export default {
  isVisible,
  isNotVisible,
  hasText
}
