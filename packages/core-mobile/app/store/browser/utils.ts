import { Tab } from './types'

export const getOldestTab = (tabs: Tab[]): Tab | undefined => {
  return tabs.sort(
    (a, b) => a.lastVisited.getTime() - b.lastVisited.getTime()
  )[0]
}

export const getLatestTab = (tabs: Tab[]): Tab | undefined => {
  return tabs.sort(
    (a, b) => b.lastVisited.getTime() - a.lastVisited.getTime()
  )[0]
}
