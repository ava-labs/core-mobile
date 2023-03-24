import { v4 as uuidv4 } from 'uuid'

export const initialState = {
  userID: uuidv4(),
  distinctID: uuidv4()
} as PosthogState

export type PosthogState = {
  userID: string
  distinctID: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface JsonList extends Array<JsonValue> {}

export type JsonValue = boolean | number | string | null | JsonList | JsonMap
export interface JsonMap {
  [key: string]: JsonValue
  [index: number]: JsonValue
}
