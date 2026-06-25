jest.mock('expo-alternate-app-icons', () => ({
  getAppIconName: jest.fn(() => null),
  setAlternateAppIcon: jest.fn(() => Promise.resolve(null)),
  supportsAlternateIcons: true
}))

jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: jest.fn() }
}))

jest.mock('utils/Utils', () => ({
  isDebugOrInternalBuild: jest.fn(() => false)
}))

import { Platform } from 'react-native'
import { getAppIconName, setAlternateAppIcon } from 'expo-alternate-app-icons'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { isDebugOrInternalBuild } from 'utils/Utils'
import { appIconStore, AppIcon, APP_ICON_DISPLAY_NAMES } from './store'

const mockedGetAppIconName = getAppIconName as jest.Mock
const mockedSetAlternateAppIcon = setAlternateAppIcon as jest.Mock
const mockedCapture = AnalyticsService.capture as jest.Mock
const mockedIsDebugOrInternalBuild = isDebugOrInternalBuild as jest.Mock

describe('appIconStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetAppIconName.mockReturnValue(null)
    mockedSetAlternateAppIcon.mockResolvedValue(null)
    mockedIsDebugOrInternalBuild.mockReturnValue(false)
    ;(Platform as { OS: string }).OS = 'ios'
    appIconStore.setState({ currentIcon: AppIcon.Default })
  })

  it('should call setAlternateAppIcon with the icon name', () => {
    appIconStore.getState().setIcon(AppIcon.Marker)
    expect(mockedSetAlternateAppIcon).toHaveBeenCalledWith('Marker')
  })

  it('should call setAlternateAppIcon with null for Default on iOS', () => {
    ;(Platform as { OS: string }).OS = 'ios'
    appIconStore.setState({ currentIcon: AppIcon.Bling })
    appIconStore.getState().setIcon(AppIcon.Default)
    expect(mockedSetAlternateAppIcon).toHaveBeenCalledWith(null)
  })

  it('should call setAlternateAppIcon with "Default" for Default on Android', () => {
    // Android routes the default icon through the .MainActivityDefault alias so
    // .MainActivity is never disabled. See CP-14555.
    ;(Platform as { OS: string }).OS = 'android'
    appIconStore.setState({ currentIcon: AppIcon.Bling })
    appIconStore.getState().setIcon(AppIcon.Default)
    expect(mockedSetAlternateAppIcon).toHaveBeenCalledWith('Default')
  })

  it('should not call setAlternateAppIcon when selecting the same icon', () => {
    appIconStore.setState({ currentIcon: AppIcon.Bling })
    appIconStore.getState().setIcon(AppIcon.Bling)
    expect(mockedSetAlternateAppIcon).not.toHaveBeenCalled()
  })

  it('should fire analytics on success', async () => {
    appIconStore.getState().setIcon(AppIcon.Old)
    await Promise.resolve()
    expect(mockedCapture).toHaveBeenCalledWith('AppIconChanged', {
      iconName: AppIcon.Old
    })
  })

  it('should not fire analytics on failure', async () => {
    mockedSetAlternateAppIcon.mockRejectedValue(new Error('fail'))
    appIconStore.getState().setIcon(AppIcon.Old)
    await Promise.resolve()
    await Promise.resolve()
    expect(mockedCapture).not.toHaveBeenCalled()
  })

  it('should rollback to native icon on failure', async () => {
    mockedSetAlternateAppIcon.mockRejectedValue(new Error('fail'))
    mockedGetAppIconName.mockReturnValue('Bling')
    appIconStore.setState({ currentIcon: AppIcon.Bling })
    appIconStore.getState().setIcon(AppIcon.Marker)

    expect(appIconStore.getState().currentIcon).toBe(AppIcon.Marker)

    await Promise.resolve()
    await Promise.resolve()

    expect(appIconStore.getState().currentIcon).toBe(AppIcon.Bling)
  })

  it('should have a display name for every AppIcon value', () => {
    for (const icon of Object.values(AppIcon)) {
      expect(APP_ICON_DISPLAY_NAMES[icon]).toBeDefined()
    }
  })

  describe('Light-Internal icon name mapping', () => {
    it('should use Light-Internal on iOS internal builds', () => {
      mockedIsDebugOrInternalBuild.mockReturnValue(true)
      ;(Platform as { OS: string }).OS = 'ios'
      appIconStore.getState().setIcon(AppIcon.Light)
      expect(mockedSetAlternateAppIcon).toHaveBeenCalledWith('Light-Internal')
    })

    it('should use Light (not Light-Internal) on Android internal builds', () => {
      mockedIsDebugOrInternalBuild.mockReturnValue(true)
      ;(Platform as { OS: string }).OS = 'android'
      appIconStore.getState().setIcon(AppIcon.Light)
      expect(mockedSetAlternateAppIcon).toHaveBeenCalledWith('Light')
    })

    it('should use Light (not Light-Internal) on iOS non-internal builds', () => {
      mockedIsDebugOrInternalBuild.mockReturnValue(false)
      ;(Platform as { OS: string }).OS = 'ios'
      appIconStore.getState().setIcon(AppIcon.Light)
      expect(mockedSetAlternateAppIcon).toHaveBeenCalledWith('Light')
    })

    it('should map Light-Internal native name back to AppIcon.Light on rollback', async () => {
      mockedSetAlternateAppIcon.mockRejectedValue(new Error('fail'))
      mockedGetAppIconName.mockReturnValue('Light-Internal')
      appIconStore.getState().setIcon(AppIcon.Marker)

      await Promise.resolve()
      await Promise.resolve()

      expect(appIconStore.getState().currentIcon).toBe(AppIcon.Light)
    })
  })
})
