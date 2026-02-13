import { createMMKV } from 'react-native-mmkv'
import { Storage } from 'redux-persist'

export const reduxStorageKeys = ['persist:root']

const storage = createMMKV({
  id: `redux`
})

export const reduxStorage: Storage & { clear: () => Promise<void> } = {
  setItem: (key, value) => {
    storage.set(key, value)
    return Promise.resolve(true)
  },
  getItem: key => {
    const value = storage.getString(key)
    return Promise.resolve(value)
  },
  removeItem: key => {
    storage.remove(key)
    return Promise.resolve()
  },
  clear: () => {
    storage.clearAll()
    return Promise.resolve()
  }
}
