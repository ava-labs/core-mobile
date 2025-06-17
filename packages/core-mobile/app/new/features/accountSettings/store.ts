import { AvatarType } from '@avalabs/k2-alpine'
import { createZustandStore } from 'common/utils/createZustandStore'
import { ZustandStorageKeys } from 'resources/Constants'
import { zustandMMKVStorage } from 'utils/mmkv/storages'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useNewContactAvatar = createZustandStore<AvatarType | undefined>(
  undefined
)

interface RecentAccountsState {
  recentAccountIds: string[]
  addRecentAccount: (accountId: string) => void
  deleteRecentAccounts: () => void
}

// Create a store that can be used outside of React components
export const recentAccountsStore = create<RecentAccountsState>()(
  persist(
    set => ({
      recentAccountIds: [],
      addRecentAccount: (accountId: string) =>
        set(state => ({
          recentAccountIds: [
            accountId,
            ...state.recentAccountIds.filter(id => id !== accountId)
          ].slice(0, 5)
        })),
      deleteRecentAccounts: () =>
        set({
          recentAccountIds: []
        })
    }),
    {
      name: ZustandStorageKeys.RECENT_ACCOUNTS,
      storage: zustandMMKVStorage,
      migrate: (persistedState: any) => {
        // Check if this is legacy data with recentAccountIndexes
        if (persistedState && 'recentAccountIndexes' in persistedState) {
          // For now, we'll clear the old data since we can't easily convert indexes to IDs
          // without access to the account store here
          delete persistedState.recentAccountIndexes
        }
        return persistedState
      },
      version: 1
    }
  )
)

// React hook that uses the store
export const useRecentAccounts = (): RecentAccountsState => {
  return recentAccountsStore()
}
