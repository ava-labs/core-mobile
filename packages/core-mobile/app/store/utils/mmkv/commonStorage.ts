import { MMKV } from 'react-native-mmkv'
import { baseStorage } from './baseStorage'

const storage = new MMKV({
  id: `common`
})

export const commonStorage = baseStorage(storage)
