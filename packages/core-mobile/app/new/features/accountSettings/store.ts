import { AvatarType } from '@avalabs/k2-alpine'
import { createZustandStore } from 'common/utils/createZustandStore'
import { ZustandStorageKeys } from 'resources/Constants'
import { zustandMMKVStorage } from 'utils/mmkv/storages'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useNewContactAvatar = createZustandStore<AvatarType | undefined>(
  undefined
)

export const useDisableLockAppStore = create(() => ({ disableLockApp: false }))

interface RecentAccountsState {
  recentAccountIds: string[]
  addRecentAccounts: (accountIds: string[]) => void
  updateRecentAccount: (accountId: string) => void
  deleteRecentAccounts: () => void
}

// Create a store that can be used outside of React components
export const recentAccountsStore = create<RecentAccountsState>()(
  persist(
    set => ({
      recentAccountIds: [],
      addRecentAccounts: (accountIds: string[]) =>
        set(state => ({
          recentAccountIds: [...state.recentAccountIds, ...accountIds]
        })),
      updateRecentAccount: (accountId: string) =>
        set(state => ({
          recentAccountIds: [
            accountId,
            ...state.recentAccountIds.filter(id => id !== accountId)
          ]
        })),
      deleteRecentAccounts: () =>
        set({
          recentAccountIds: []
        })
    }),
    {
      name: ZustandStorageKeys.RECENT_ACCOUNTS,
      storage: zustandMMKVStorage,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
