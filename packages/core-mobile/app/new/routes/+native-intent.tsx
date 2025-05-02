export function redirectSystemPath(): null {
  // Return null or a fallback path to disable expo-router deep linking
  // deeplinking is handled in DeepLinkContext to store the pending deeplink
  // and process it when the app is unlocked
  return null
}
