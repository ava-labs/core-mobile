import { Storage } from 'redux-persist'

export type TStorage = Storage & { clear: () => Promise<void> }
