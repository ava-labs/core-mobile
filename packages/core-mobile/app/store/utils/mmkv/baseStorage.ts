import { MMKV } from 'react-native-mmkv'
import { TStorage } from './types'

export const baseStorage = (storage: MMKV): TStorage => {
  return {
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
}
