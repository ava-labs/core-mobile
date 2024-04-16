import { MMKV } from 'react-native-mmkv'
import { SECURE_ACCESS_SET } from 'resources/Constants'

export const commonStorageKeys = ['POSTHOG_SUSPENDED', SECURE_ACCESS_SET]

export const commonStorage = new MMKV({
  id: `common`
})

export const queryStorage = new MMKV({
  id: `query`
})
