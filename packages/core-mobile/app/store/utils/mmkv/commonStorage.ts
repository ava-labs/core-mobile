import { MMKV } from 'react-native-mmkv'
import { SECURE_ACCESS_SET } from 'resources/Constants'
import { baseStorage } from './baseStorage'

export const commonStorageKeys = ['POSTHOG_SUSPENDED', SECURE_ACCESS_SET]

const storage = new MMKV({
  id: `common`
})

export const commonStorage = baseStorage(storage)
