/* eslint-disable @typescript-eslint/explicit-function-return-type */
function withPlatform(ios: string, android: string) {
  return driver.isIOS ? $(ios) : $(android)
}

function getByText(text: string) {
  return withPlatform(`//*[@name="${text}"]`, `//*[@text="${text}"]`)
}

function getById(id: string) {
  return withPlatform(`~${id}`, `//*[@resource-id="${id}"]`)
}

function getBySomeText(text: string) {
  return withPlatform(
    `//*[contains(@name, "${text}")]`,
    `//*[contains(@text, "${text}")]`
  )
}

export const selectors = {
  getByText,
  getById,
  getBySomeText
}
