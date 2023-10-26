import { Tab } from './types'

export const getOldestTab = (tabs: Tab[]): Tab | undefined => {
  return tabs.sort((a, b) => (a.lastVisited ?? 0) - (b.lastVisited ?? 0))[0]
}

export const getLatestTab = (tabs: Tab[]): Tab | undefined => {
  return tabs.sort((a, b) => (b.lastVisited ?? 0) - (a.lastVisited ?? 0))[0]
}
