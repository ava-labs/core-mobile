import { Tab } from './types'

export const getOldestTab = (tabs: Tab[], count: number): Tab[] => {
  return tabs
    .sort((a, b) => (a.lastVisited ?? 0) - (b.lastVisited ?? 0))
    .slice(0, count - 1)
}

export const getLatestTab = (tabs: Tab[]): Tab | undefined => {
  return tabs.sort((a, b) => (b.lastVisited ?? 0) - (a.lastVisited ?? 0))[0]
}
