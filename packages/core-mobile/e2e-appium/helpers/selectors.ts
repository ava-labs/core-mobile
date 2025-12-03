function withPlatform(ios: string, android: string) {
  return driver.isIOS ? $(ios) : $(android)
}

function withPlatformAll(ios: string, android: string) {
  return driver.isIOS ? $$(ios) : $$(android)
}

function getByText(text: string) {
  return withPlatform(
    `-ios predicate string:name == "${text}" AND accessible == true`,
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
    `-ios predicate string:name == "${text}" AND accessible == true`,
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

function getBySmartText(textOrId: string) {
  return withPlatform(
    // iOS
    `-ios predicate string:
      (name == "${textOrId}" 
       OR name == "${textOrId.toUpperCase()}"
       OR label == "${textOrId}" 
       OR value == "${textOrId}"
      )`,
    // Android
    `//*[@resource-id='${textOrId}' or @content-desc='${textOrId}' or @text='${textOrId}' or @text='${textOrId.toUpperCase()}']`
  )
}

function getByXpath(xpath: string) {
  return $(xpath)
}

function getBySomeText(text: string) {
  return withPlatform(
    `-ios predicate string:name CONTAINS "${text}" AND accessible == true`,
    `//*[contains(@text, '${text}')]`
  )
}

export const selectors = {
  getByText,
  getById,
  getByIdWithIndex,
  getByTextWithIndex,
  getBySomeText,
  getByXpath,
  getBySmartText
}
