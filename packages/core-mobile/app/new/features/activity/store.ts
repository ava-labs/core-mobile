import { AvatarType, IndexPath } from '@avalabs/k2-alpine'
import { createZustandStore } from 'common/utils/createZustandStore'
import { ZustandStorageKeys } from 'resources/Constants'
import { zustandMMKVStorage } from 'utils/mmkv/storages'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useNewContactAvatar = createZustandStore<AvatarType | undefined>(
  undefined
)

interface ActivityState {
  selectedNetwork: IndexPath
  setSelectedNetwork: (network: IndexPath) => void
}

// Create a store that can be used outside of React components
export const activityStore = create<ActivityState>()(
  persist(
    set => ({
      selectedNetwork: {
        section: 0,
        row: 0
      },
      setSelectedNetwork: (network: IndexPath) =>
        set({
          selectedNetwork: network
        })
    }),
    {
      name: ZustandStorageKeys.ACTIVITY,
      storage: zustandMMKVStorage
    }
  )
)

// React hook that uses the store
export const useActivity = (): ActivityState => {
  return activityStore()
}
