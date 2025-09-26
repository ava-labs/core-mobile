import { MMKV } from 'react-native-mmkv'
import { StorageKey } from 'resources/Constants'
import { StorageValue } from 'zustand/middleware'
import { PersistStorage, StateStorage } from 'zustand/middleware'

export const commonStorageKeys = [
  StorageKey.POSTHOG_SUSPENDED,
  StorageKey.SECURE_ACCESS_SET,
  StorageKey.LAST_SEEN_UPDATE_APP_VERSION
]

export const commonStorage = new MMKV({
  id: `common`
})

export const queryStorage = new MMKV({
  id: `query`
})

const zustandStorage = new MMKV({
  id: `zustand`
})

export const zustandMMKVStorage: PersistStorage<StateStorage> = {
  getItem: (name: string) => {
    const value = zustandStorage.getString(name)
    return value ? JSON.parse(value) : null
  },
  setItem: (name: string, value: StorageValue<StateStorage>) => {
    zustandStorage.set(name, JSON.stringify(value))
  },
  removeItem: (name: string) => {
    zustandStorage.delete(name)
  }
}
