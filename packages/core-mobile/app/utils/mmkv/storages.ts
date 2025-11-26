import { MMKV } from 'react-native-mmkv'
import { StorageKey } from 'resources/Constants'
import Logger from 'utils/Logger'
import { StorageValue } from 'zustand/middleware'
import { PersistStorage, StateStorage } from 'zustand/middleware'

export const commonStorageKeys = [
  StorageKey.POSTHOG_SUSPENDED,
  StorageKey.SECURE_ACCESS_SET,
  StorageKey.LAST_SEEN_UPDATE_APP_VERSION,
  StorageKey.MIGRATED_ACTIVE_ACCOUNTS_WALLET_IDS,
  StorageKey.MIGRATED_XP_ADDRESSES_WALLET_IDS
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

export const saveArrayToStorage = <T>(
  storage: MMKV,
  key: string,
  value: T[]
): void => {
  try {
    const json = JSON.stringify(value)
    storage.set(key, json)
  } catch (err) {
    Logger.error(`[MMKV:setArray] Failed to stringify ${key}`, err)
  }
}

export const loadArrayFromStorage = <T>(storage: MMKV, key: string): T[] => {
  try {
    const json = storage.getString(key)
    if (!json) return []
    return JSON.parse(json) as T[]
  } catch (err) {
    Logger.error(`[MMKV:getArray] Failed to parse ${key}`, err)
    return []
  }
}

export const appendToStoredArray = <T>(
  storage: MMKV,
  key: string,
  item: T
): T[] => {
  const arr = loadArrayFromStorage<T>(storage, key)
  const updated = [...arr, item]
  saveArrayToStorage(storage, key, updated)
  return updated
}
