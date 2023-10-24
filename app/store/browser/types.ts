export type TabId = string

export type ActiveTabId = TabId

export const initialState: BrowserState = {
  activeTabId: ''
}
export interface BrowserState {
  activeTabId?: ActiveTabId
}
