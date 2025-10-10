function withPlatform(ios: string, android: string) {
  return driver.isIOS ? $(ios) : $(android)
}

function withPlatformAll(ios: string, android: string) {
  return driver.isIOS ? $$(ios) : $$(android)
}

function getByText(text: string) {
  return withPlatform(
    `//*[@name='${text}' and @accessible='true']`,
    `//*[@text='${text}']`
  )
}

function getByIdWithIndex(id: string, index = 0) {
  const elements = withPlatformAll(
    `~${id}`,
    `//*[@resource-id='${id}' or @content-desc='${id}']`
  )
  return elements[index]
}

function getByTextWithIndex(text: string, index = 0) {
  const elements = withPlatformAll(
    `//*[@name='${text}' and @accessible='true']`,
    `//*[@text='${text}']`
  )
  return elements[index]
}

function getById(id: string) {
  return withPlatform(
    `~${id}`,
    `//*[@resource-id='${id}' or @content-desc='${id}']`
  )
}

function getByXpath(xpath: string) {
  return $(xpath)
}

function getBySomeText(text: string) {
  return withPlatform(
    `//*[contains(@name, '${text}') and @accessible='true']`,
    `//*[contains(@text, '${text}')]`
  )
}

export const selectors = {
  getByText,
  getById,
  getByIdWithIndex,
  getByTextWithIndex,
  getBySomeText,
  getByXpath
}
