import { Storage } from 'redux-persist'

export type TStorage = Storage & {
  clear: () => void
  getBoolean: (key: string) => boolean | undefined
}
