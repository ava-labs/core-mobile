function withPlatform(ios: string, android: string) {
  return driver.isIOS ? $(ios) : $(android)
}

function withPlatformAll(ios: string, android: string) {
  return driver.isIOS ? $$(ios) : $$(android)
}

function getByText(text: string) {
  return withPlatform(
    `-ios predicate string:name == "${text}"`,
    `android=new UiSelector().text("${text}")`
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
  return withPlatform(`~${id}`, `android=new UiSelector().resourceId("${id}")`)
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
    // Android: case-insensitive text match covers both 'Save' and 'SAVE' styled buttons
    `android=new UiSelector().textMatches("(?i)^${textOrId}$")`
  )
}

function getBySomeId(id: string) {
  return withPlatform(
    `-ios predicate string:identifier CONTAINS "${id}"`,
    `android=new UiSelector().resourceIdMatches(".*${id}.*")`
  )
}

function getByXpath(xpath: string) {
  return $(xpath)
}

function getBySomeText(text: string) {
  return withPlatform(
    `-ios predicate string:name CONTAINS "${text}" AND accessible == true`,
    `android=new UiSelector().textContains("${text}")`
  )
}

function getBySomeTextV2(text: string) {
  return withPlatform(
    `-ios predicate string:name CONTAINS "${text}"`,
    `android=new UiSelector().textContains("${text}")`
  )
}

export const selectors = {
  getByText,
  getById,
  getByIdWithIndex,
  getByTextWithIndex,
  getBySomeText,
  getBySomeTextV2,
  getBySomeId,
  getByXpath,
  getBySmartText
}
