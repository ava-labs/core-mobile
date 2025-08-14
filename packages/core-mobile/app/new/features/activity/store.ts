import { AvatarType } from '@avalabs/k2-alpine'
import { createZustandStore } from 'common/utils/createZustandStore'
import { ZustandStorageKeys } from 'resources/Constants'
import { zustandMMKVStorage } from 'utils/mmkv/storages'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ActivityNetworkFilter } from './hooks/useActivityFilterAndSearch'

export const useNewContactAvatar = createZustandStore<AvatarType | undefined>(
  undefined
)

interface ActivityState {
  selectedNetwork?: ActivityNetworkFilter
  setSelectedNetwork: (network: ActivityNetworkFilter) => void
}

// Create a store that can be used outside of React components
export const activityStore = create<ActivityState>()(
  persist(
    set => ({
      selectedNetwork: undefined,
      setSelectedNetwork: (network: ActivityNetworkFilter) =>
        set({
          selectedNetwork: network
        })
    }),
    {
      name: ZustandStorageKeys.ACTIVITY,
      storage: zustandMMKVStorage,
      migrate: (persistedState: any) => {
        // Check if this is legacy data with recentAccountIndexes
        if (
          persistedState &&
          'selectedNetwork' in persistedState &&
          persistedState.selectedNetwork?.section !== undefined &&
          persistedState.selectedNetwork?.row !== undefined
        ) {
          // This is to default the selected network to the first network when user is upgrading from older version of the app
          // the selected network was set to IndexPath object instead of ActivityNetworkFilter
          persistedState.selectedNetwork = undefined
        }
        return persistedState
      },
      version: 1
    }
  )
)

// React hook that uses the store
export const useActivity = (): ActivityState => {
  return activityStore()
}
