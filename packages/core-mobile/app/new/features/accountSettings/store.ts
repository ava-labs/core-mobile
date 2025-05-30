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
  recentAccountIndexes: number[]
  addRecentAccount: (accountIndex: number) => void
  deleteRecentAccounts: () => void
}

export const recentAccountsStore = create<RecentAccountsState>()(
  persist(
    set => ({
      recentAccountIndexes: [],
      addRecentAccount: (accountIndex: number) =>
        set(state => ({
          recentAccountIndexes: [
            accountIndex,
            ...state.recentAccountIndexes.filter(
              index => index !== accountIndex
            )
          ].slice(0, 5)
        })),
      deleteRecentAccounts: () =>
        set({
          recentAccountIndexes: []
        })
    }),
    {
      name: ZustandStorageKeys.RECENT_ACCOUNTS,
      storage: zustandMMKVStorage
    }
  )
)

// React hook that uses the store
export const useRecentAccounts = (): RecentAccountsState => {
  return recentAccountsStore()
}
