import { AvatarType } from '@avalabs/k2-alpine'
import { createZustandStore } from 'common/utils/createZustandStore'
import {
  getAppIconName,
  setAlternateAppIcon,
  supportsAlternateIcons
} from 'expo-alternate-app-icons'
import { Platform } from 'react-native'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { ZustandStorageKeys, zustandPersistStorage } from 'utils/mmkv'
import { isDebugOrInternalBuild } from 'utils/Utils'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useNewContactAvatar = createZustandStore<AvatarType | undefined>(
  undefined
)

export const useDisableLockAppStore = create(() => ({ disableLockApp: false }))

export const manualLockStore = create(() => ({ wasManuallyLocked: false }))

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
      storage: zustandPersistStorage,
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

// App Icon

export enum AppIcon {
  Default = 'Default',
  Light = 'Light',
  Old = 'Old',
  Bling = 'Bling',
  Shiny = 'Shiny',
  Marker = 'Marker',
  Minimalism = 'Minimalism',
  Neon = 'Neon',
  Layered = 'Layered',
  Liquid = 'Liquid',
  Misaligned = 'Misaligned'
}

export const APP_ICON_DISPLAY_NAMES: Record<AppIcon, string> = {
  [AppIcon.Default]: 'Core',
  [AppIcon.Light]: 'Core light',
  [AppIcon.Old]: 'Old school Core',
  [AppIcon.Bling]: 'Bling',
  [AppIcon.Shiny]: 'So shiny',
  [AppIcon.Marker]: 'Marker',
  [AppIcon.Minimalism]: 'Minimalism',
  [AppIcon.Neon]: 'Neon',
  [AppIcon.Layered]: 'Layered',
  [AppIcon.Liquid]: 'Liquid',
  [AppIcon.Misaligned]: 'Misaligned'
}

export const APP_ICON_SUBTITLES: Partial<Record<AppIcon, string>> = {
  [AppIcon.Default]: 'Default icon'
}

export const DEFAULT_ICON_PREVIEW_LIGHT: number = isDebugOrInternalBuild()
  ? require('../../../assets/app-icons/AppIcon-light-dev.png')
  : require('../../../assets/app-icons/AppIcon-light.png')
export const DEFAULT_ICON_PREVIEW_DARK: number = isDebugOrInternalBuild()
  ? require('../../../assets/app-icons/AppIcon-dark-dev.png')
  : require('../../../assets/app-icons/AppIcon-dark.png')

export const ICON_PREVIEWS: Record<AppIcon, number> = {
  [AppIcon.Default]: DEFAULT_ICON_PREVIEW_DARK,
  [AppIcon.Light]: DEFAULT_ICON_PREVIEW_LIGHT,
  [AppIcon.Old]: require('../../../assets/app-icons/AppIcon-old.png'),
  [AppIcon.Bling]: require('../../../assets/app-icons/AppIcon-bling.png'),
  [AppIcon.Shiny]: require('../../../assets/app-icons/AppIcon-shiny.png'),
  [AppIcon.Marker]: require('../../../assets/app-icons/AppIcon-marker.png'),
  [AppIcon.Minimalism]: require('../../../assets/app-icons/AppIcon-minimalism.png'),
  [AppIcon.Neon]: require('../../../assets/app-icons/AppIcon-neon.png'),
  [AppIcon.Layered]: require('../../../assets/app-icons/AppIcon-layered.png'),
  [AppIcon.Liquid]: require('../../../assets/app-icons/AppIcon-liquid.png'),
  [AppIcon.Misaligned]: require('../../../assets/app-icons/AppIcon-misaligned.png')
}

function nativeNameToAppIcon(name: string | null): AppIcon {
  if (name === null) return AppIcon.Default
  if (name === 'Light-Internal') return AppIcon.Light
  return (
    (Object.values(AppIcon).find(v => v === name) as AppIcon) ?? AppIcon.Default
  )
}

interface AppIconState {
  currentIcon: AppIcon
  setIcon: (icon: AppIcon) => void
}

export const appIconStore = create<AppIconState>(set => ({
  currentIcon: nativeNameToAppIcon(getAppIconName()),
  setIcon: (icon: AppIcon) => {
    const { currentIcon } = appIconStore.getState()
    if (icon === currentIcon) return
    if (!supportsAlternateIcons) return

    let nativeIconName: string | null = icon === AppIcon.Default ? null : icon
    if (icon === AppIcon.Default && Platform.OS === 'android') {
      // Android routes the default icon through the .MainActivityDefault alias so that
      // .MainActivity (the shared targetActivity of every alias) is never disabled when
      // switching icons. iOS keeps null, which resets to the primary icon. See CP-14555.
      nativeIconName = 'Default'
    }
    if (
      icon === AppIcon.Light &&
      isDebugOrInternalBuild() &&
      Platform.OS === 'ios'
    ) {
      nativeIconName = 'Light-Internal'
    }
    set({ currentIcon: icon })

    setAlternateAppIcon(nativeIconName)
      .then(() => {
        AnalyticsService.capture('AppIconChanged', { iconName: icon })
      })
      .catch(() => {
        set({ currentIcon: nativeNameToAppIcon(getAppIconName()) })
      })
  }
}))

export const useAppIcon = (): AppIconState => {
  return appIconStore()
}

export const useCurrentAppIcon = (): AppIcon => {
  return appIconStore(s => s.currentIcon)
}
