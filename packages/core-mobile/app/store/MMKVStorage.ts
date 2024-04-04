import { Storage } from 'redux-persist'
import { MMKV } from 'react-native-mmkv'
import Logger from 'utils/Logger'
import AsyncStorage from '@react-native-async-storage/async-storage'

const storage = new MMKV()

export const MMKVStorage: Storage & { clear: () => Promise<void> } = {
  setItem: (key, value) => {
    storage.set(key, value)
    return Promise.resolve(true)
  },
  getItem: key => {
    const value = storage.getString(key)
    return Promise.resolve(value)
  },
  removeItem: key => {
    storage.delete(key)
    return Promise.resolve()
  },
  clear: () => {
    storage.clearAll()
    return Promise.resolve()
  }
}

// TODO: Remove `hasMigratedFromAsyncStorage` after a while (when everyone has migrated)
export const hasMigratedFromAsyncStorage = storage.getBoolean(
  'hasMigratedFromAsyncStorage'
)

// TODO: Remove `hasMigratedFromAsyncStorage` after a while (when everyone has migrated)
export async function migrateFromAsyncStorage(): Promise<void> {
  Logger.info('Migration from AsyncStorage -> MMKKV started!')
  const keys = await AsyncStorage.getAllKeys()
  for (const key of keys) {
    try {
      const value = await AsyncStorage.getItem(key)
      if (value != null) {
        if (['true', 'false'].includes(value)) {
          storage.set(key, value === 'true')
        } else {
          storage.set(key, value)
        }
        AsyncStorage.removeItem(key)
      }
    } catch (error) {
      Logger.error(
        `Failed to migrate key "${key}" from AsyncStorage to MMKV!`,
        error
      )
      throw error
    }
  }
  storage.set('hasMigratedFromAsyncStorage', true)
  Logger.info(`Migration from AsyncStorage -> MMKV completed!`)
}
