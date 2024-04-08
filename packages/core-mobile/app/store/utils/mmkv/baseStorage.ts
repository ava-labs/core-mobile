import { MMKV } from 'react-native-mmkv'
import Logger from 'utils/Logger'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { TStorage } from './types'
import { commonStorage, commonStorageKeys } from './commonStorage'
import { reduxStorage } from './reduxStorage'

export const baseStorage = (storage: MMKV): TStorage => {
  return {
    setItem: (key, value) => {
      return storage.set(key, value)
    },
    getItem: key => {
      return storage.getString(key)
    },
    removeItem: key => {
      storage.delete(key)
    },
    getBoolean: key => {
      return storage.getBoolean(key)
    },
    clear: () => {
      storage.clearAll()
    }
  }
}

// TODO: Remove `hasMigratedFromAsyncStorage` after a while (when everyone has migrated)
export const hasMigratedFromAsyncStorage = commonStorage.getBoolean(
  'hasMigratedFromAsyncStorage'
)

// TODO: Remove `hasMigratedFromAsyncStorage` after a while (when everyone has migrated)
export async function migrateFromAsyncStorage(): Promise<void> {
  Logger.info('Migration from AsyncStorage -> MMKKV started!')
  try {
    const keys = await AsyncStorage.getAllKeys()
    const values = await AsyncStorage.multiGet(keys)
    values.forEach(async ([key, value]) => {
      if (value != null) {
        const newValue = ['true', 'false'].includes(value)
          ? value === 'true'
          : value
        if (commonStorageKeys.includes(key)) {
          commonStorage.setItem(key, newValue)
        } else {
          await reduxStorage.setItem(key, newValue)
        }
      }
    })
    await AsyncStorage.clear().catch(Logger.error)
    commonStorage.setItem('hasMigratedFromAsyncStorage', true)
    Logger.info(`Migration from AsyncStorage -> MMKV completed!`)
  } catch (error) {
    Logger.error('Error migrating from AsyncStorage to MMKV:', error)
  }
}
