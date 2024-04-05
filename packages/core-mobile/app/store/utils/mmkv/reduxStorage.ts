import { MMKV } from 'react-native-mmkv'
import Logger from 'utils/Logger'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { baseStorage } from './baseStorage'

const storage = new MMKV({
  id: `redux`
})

export const reduxStorage = baseStorage(storage)

// TODO: Remove `hasMigratedFromAsyncStorage` after a while (when everyone has migrated)
export const hasMigratedFromAsyncStorage = storage.getBoolean(
  'hasMigratedFromAsyncStorage'
)

// TODO: Remove `hasMigratedFromAsyncStorage` after a while (when everyone has migrated)
export async function migrateFromAsyncStorage(): Promise<void> {
  Logger.info('Migration from AsyncStorage -> MMKKV started!')
  const keys = await AsyncStorage.getAllKeys()
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key)
    if (value != null) {
      if (['true', 'false'].includes(value)) {
        storage.set(key, value === 'true')
      } else {
        storage.set(key, value)
      }
      await AsyncStorage.removeItem(key).catch(Logger.error)
    }
  }
  storage.set('hasMigratedFromAsyncStorage', true)
  Logger.info(`Migration from AsyncStorage -> MMKV completed!`)
}
