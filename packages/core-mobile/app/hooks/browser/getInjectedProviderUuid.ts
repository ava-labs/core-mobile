import { commonStorage, CommonStorageKeys } from 'utils/mmkv'
import { uuid as generateUuid } from 'utils/uuid'

let cached: string | undefined

export function getInjectedProviderUuid(): string {
  if (cached) return cached

  const stored = commonStorage.getString(
    CommonStorageKeys.INJECTED_PROVIDER_UUID
  )
  if (stored) {
    cached = stored
    return stored
  }

  const fresh = generateUuid()
  commonStorage.set(CommonStorageKeys.INJECTED_PROVIDER_UUID, fresh)
  cached = fresh
  return fresh
}
