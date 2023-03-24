import { v4 as uuidv4 } from 'uuid'

export const initialState = {
  userID: uuidv4(),
  distinctID: uuidv4(),
  isAnalyticsEnabled: false
} as PosthogState

export type PosthogState = {
  userID: string
  distinctID: string
  isAnalyticsEnabled: boolean
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface JsonList extends Array<JsonValue> {}

export type JsonValue = boolean | number | string | null | JsonList | JsonMap
export interface JsonMap {
  [key: string]: JsonValue
  [index: number]: JsonValue
}
