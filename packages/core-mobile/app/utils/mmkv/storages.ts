import { MMKV } from 'react-native-mmkv'
import { StorageKey } from 'resources/Constants'

export const commonStorageKeys = [
  StorageKey.POSTHOG_SUSPENDED,
  StorageKey.SECURE_ACCESS_SET
]

export const commonStorage = new MMKV({
  id: `common`
})

export const queryStorage = new MMKV({
  id: `query`
})
