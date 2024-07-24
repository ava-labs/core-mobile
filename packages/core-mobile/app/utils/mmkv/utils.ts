import Logger from 'utils/Logger'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { reduxStorage, reduxStorageKeys } from 'store/reduxStorage'
import { commonStorage, commonStorageKeys } from './storages'

// TODO: Remove `hasMigratedFromAsyncStorage` after a while (when everyone has migrated)
export const hasMigratedFromAsyncStorage = (): boolean | undefined =>
  commonStorage.getBoolean('hasMigratedFromAsyncStorage')

// TODO: Remove `hasMigratedFromAsyncStorage` after a while (when everyone has migrated)
export async function migrateFromAsyncStorage(): Promise<void> {
  Logger.info('Migration from AsyncStorage -> MMKKV started!')
  try {
    const keys = await AsyncStorage.getAllKeys()
    if (keys.length === 0) {
      commonStorage.set('hasMigratedFromAsyncStorage', true)
      Logger.info(`Skip AsyncStorage Migration: No keys found in AsyncStorage!`)
      return
    }
    const values = await AsyncStorage.multiGet(keys)
    values.forEach(async ([key, value]) => {
      if (value != null) {
        const newValue = ['true', 'false'].includes(value)
          ? value === 'true'
          : value
        if (commonStorageKeys.includes(key)) {
          commonStorage.set(key, newValue)
          await AsyncStorage.removeItem(key).catch(error => {
            Logger.error(`Error removing key ${key} from AsyncStorage:`, error)
          })
        }
        if (reduxStorageKeys.includes(key)) {
          await reduxStorage.setItem(key, newValue)
          await AsyncStorage.removeItem(key).catch(error => {
            Logger.error(`Error removing key ${key} from AsyncStorage:`, error)
          })
        }
      }
    })
    commonStorage.set('hasMigratedFromAsyncStorage', true)
    Logger.info(`Migration from AsyncStorage -> MMKV completed!`)
  } catch (error) {
    Logger.error('Error migrating from AsyncStorage to MMKV:', error)
  }
}
