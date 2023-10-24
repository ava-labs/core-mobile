import { TabData } from './types'

export const getOldestEntity = (tabs: TabData[]): TabData | undefined => {
  return tabs.sort(
    (a, b) => a.lastVisited.getTime() - b.lastVisited.getTime()
  )[0]
}

export const getLatestEntity = (tabs: TabData[]): TabData | undefined => {
  return tabs.sort(
    (a, b) => b.lastVisited.getTime() - a.lastVisited.getTime()
  )[0]
}
