jest.mock('expo-alternate-app-icons', () => ({
  getAppIconName: jest.fn(() => null),
  setAlternateAppIcon: jest.fn(() => Promise.resolve(null)),
  supportsAlternateIcons: true
}))

jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: jest.fn() }
}))

import { getAppIconName, setAlternateAppIcon } from 'expo-alternate-app-icons'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { appIconStore, AppIcon, APP_ICON_DISPLAY_NAMES } from './store'

const mockedGetAppIconName = getAppIconName as jest.Mock
const mockedSetAlternateAppIcon = setAlternateAppIcon as jest.Mock
const mockedCapture = AnalyticsService.capture as jest.Mock

describe('appIconStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetAppIconName.mockReturnValue(null)
    mockedSetAlternateAppIcon.mockResolvedValue(null)
    appIconStore.setState({ currentIcon: AppIcon.Default })
  })

  it('should call setAlternateAppIcon with the icon name', () => {
    appIconStore.getState().setIcon(AppIcon.Marker)
    expect(mockedSetAlternateAppIcon).toHaveBeenCalledWith('Marker')
  })

  it('should call setAlternateAppIcon with null for Default', () => {
    appIconStore.setState({ currentIcon: AppIcon.Bling })
    appIconStore.getState().setIcon(AppIcon.Default)
    expect(mockedSetAlternateAppIcon).toHaveBeenCalledWith(null)
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
})
