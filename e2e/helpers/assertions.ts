import { expect, element } from 'detox'

const isVisible = async item => {
  await expect(element(item)).toBeVisible()
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
