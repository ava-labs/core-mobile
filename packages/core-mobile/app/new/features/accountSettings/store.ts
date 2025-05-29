import { AvatarType } from '@avalabs/k2-alpine'
import { createZustandStore } from 'common/utils/createZustandStore'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const useNewContactAvatar = createZustandStore<AvatarType | undefined>(
  undefined
)

interface RecentAccountsState {
  recentAccountIndexes: number[]
  addRecentAccount: (accountIndex: number) => void
  deleteRecentAccounts: () => void
}

export const useRecentAccounts = create<RecentAccountsState>()(
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
      name: 'recent-accounts-storage',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
)
