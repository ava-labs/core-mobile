import { MMKV } from 'react-native-mmkv'
import { StorageKey } from 'resources/Constants'
import { StorageValue } from 'zustand/middleware'

export const commonStorageKeys = [
  StorageKey.POSTHOG_SUSPENDED,
  StorageKey.SECURE_ACCESS_SET,
  StorageKey.RECENT_ACCOUNTS
]

export const commonStorage = new MMKV({
  id: `common`
})

export const queryStorage = new MMKV({
  id: `query`
})

export const zustandMMKVStorage = {
  getItem: <T>(name: string): StorageValue<T> | null => {
    const value = commonStorage.getString(name)
    return value ? JSON.parse(value) : null
  },
  setItem: <T>(name: string, value: StorageValue<T>) => {
    commonStorage.set(name, JSON.stringify(value))
  },
  removeItem: (name: string) => {
    commonStorage.delete(name)
  }
}
