import { v4 as uuidv4 } from 'uuid'

export const initialState = {
  userID: uuidv4(),
  distinctId: uuidv4()
} as PosthogState

export type PosthogState = {
  userID: string
  distinctId: string
}
