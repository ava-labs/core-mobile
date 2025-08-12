export function getCurrentPageIndex(
  screen: string,
  screens: string[],
  pathname: string
): number {
  if (!pathname) return 0
  const parts = pathname.split('/').filter(Boolean)
  const foundIndex = parts.findIndex(p => p === screen)
  const currentScreen = foundIndex >= 0 ? parts[foundIndex + 1] : undefined
  const indexInFlow = currentScreen ? screens.indexOf(currentScreen) : -1
  return indexInFlow >= 0 ? indexInFlow : 0
}
