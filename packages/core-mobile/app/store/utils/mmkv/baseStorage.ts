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
  const keys = await AsyncStorage.getAllKeys()
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key)
    if (value != null) {
      if (commonStorageKeys.includes(key)) {
        setItem(commonStorage, key, value)
      } else {
        setItem(reduxStorage, key, value)
      }
      await AsyncStorage.removeItem(key).catch(Logger.error)
    }
  }
  commonStorage.setItem('hasMigratedFromAsyncStorage', true)
  Logger.info(`Migration from AsyncStorage -> MMKV completed!`)
}

const setItem = (mmkvStorage: TStorage, key: string, value: string): void => {
  if (['true', 'false'].includes(value)) {
    mmkvStorage.setItem(key, value === 'true')
  } else {
    mmkvStorage.setItem(key, value)
  }
}
