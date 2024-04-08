import { MMKV } from 'react-native-mmkv'
import { baseStorage } from './baseStorage'

const storage = new MMKV({
  id: `redux`
})

export const reduxStorage = baseStorage(storage)
