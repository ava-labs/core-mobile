import { commonStorage } from 'utils/mmkv/storages'
import { StorageKey } from 'resources/Constants'
import { uuid as generateUuid } from 'utils/uuid'

let cached: string | undefined

export function getInjectedProviderUuid(): string {
  if (cached) return cached

  const stored = commonStorage.getString(StorageKey.INJECTED_PROVIDER_UUID)
  if (stored) {
    cached = stored
    return stored
  }

  const fresh = generateUuid()
  commonStorage.set(StorageKey.INJECTED_PROVIDER_UUID, fresh)
  cached = fresh
  return fresh
}
