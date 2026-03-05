import { AuthorizationStatus } from '@notifee/react-native'
import { Platform } from 'react-native'
import AnalyticsService from 'services/analytics/AnalyticsService'
import NotificationsService from 'services/notifications/NotificationsService'
import { AppListenerEffectAPI } from 'store/types'
import { selectHasBeenViewedOnce } from 'store/viewOnce'
import { selectIsEnableNotificationPromptBlocked } from 'store/posthog'
import { showAlert } from '@avalabs/k2-alpine'
import { handleAfterLoginFlows } from './handleAfterLoginFlows'

jest.mock('@avalabs/k2-alpine', () => ({
  showAlert: jest.fn()
}))

jest.mock('services/analytics/AnalyticsService', () => ({
  capture: jest.fn()
}))

jest.mock('services/notifications/NotificationsService', () => ({
  getNotificationSettings: jest.fn(),
  getAllPermissions: jest.fn(),
  openSystemSettings: jest.fn()
}))

jest.mock('services/AppUpdateService/AppUpdateService', () => ({
  AppUpdateService: {
    checkAppUpdateStatus: jest.fn().mockResolvedValue(null)
  }
}))

jest.mock('common/utils/navigateWithPromise', () => ({
  navigateWithPromise: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('common/utils/waitForInteractions', () => ({
  waitForInteractions: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('store/viewOnce', () => ({
  selectHasBeenViewedOnce: jest.fn(),
  setViewOnce: jest.fn(() => ({
    type: 'viewOnce/setViewOnce'
  })),
  ViewOnceKey: { NOTIFICATIONS_PROMPT: 'NOTIFICATIONS_PROMPT' }
}))

jest.mock('store/posthog', () => ({
  selectIsEnableNotificationPromptBlocked: jest.fn(),
  selectIsNestEggCampaignBlocked: jest.fn().mockReturnValue(true),
  selectIsNestEggEligible: jest.fn().mockReturnValue(false),
  selectIsNestEggNewSeedlessOnly: jest.fn().mockReturnValue(false),
  selectIsSolanaLaunchModalBlocked: jest.fn().mockReturnValue(true),
  selectIsSolanaSupportBlocked: jest.fn().mockReturnValue(true)
}))

jest.mock('store/nestEgg', () => ({
  selectHasAcknowledgedNestEggQualification: jest.fn().mockReturnValue(false),
  selectHasQualifiedForNestEgg: jest.fn().mockReturnValue(false),
  selectIsUserEligibleForNestEggModal: jest.fn().mockReturnValue(false)
}))

jest.mock('store/nestEgg/slice', () => ({
  selectIsNewSeedlessUserEligibleForNestEggModal: jest
    .fn()
    .mockReturnValue(false)
}))

const TURN_ON_ALL_ACTION = { type: 'notifications/turnOnAllNotifications' }

jest.mock('../slice', () => ({
  turnOnAllNotifications: jest.fn(() => TURN_ON_ALL_ACTION)
}))

jest.mock('react-native-config', () => ({}))

const mockShowAlert = showAlert as jest.MockedFunction<typeof showAlert>
const mockGetNotificationSettings =
  NotificationsService.getNotificationSettings as jest.Mock
const mockGetAllPermissions =
  NotificationsService.getAllPermissions as jest.Mock
const mockOpenSystemSettings =
  NotificationsService.openSystemSettings as jest.Mock
const mockCapture = AnalyticsService.capture as jest.Mock

type AlertButton = { text: string; onPress?: () => void | Promise<void> }

function createListenerApi(
  overrides: Partial<AppListenerEffectAPI> = {}
): AppListenerEffectAPI {
  return {
    getState: jest.fn().mockReturnValue({}),
    dispatch: jest.fn(),
    ...overrides
  } as unknown as AppListenerEffectAPI
}

function setupNotPromptedUser(): void {
  ;(selectHasBeenViewedOnce as jest.Mock).mockReturnValue(() => false)
  ;(selectIsEnableNotificationPromptBlocked as jest.Mock).mockReturnValue(false)
}

describe('handleAfterLoginFlows - promptEnableNotificationsIfNeeded', () => {
  const action = { type: 'test' }

  beforeEach(() => {
    jest.clearAllMocks()
    setupNotPromptedUser()
  })

  describe('early exit conditions', () => {
    it('should skip notification prompt when user already prompted and permissions are granted', async () => {
      ;(selectHasBeenViewedOnce as jest.Mock).mockReturnValue(() => true)
      mockGetNotificationSettings.mockResolvedValue(
        AuthorizationStatus.AUTHORIZED
      )

      const listenerApi = createListenerApi()
      await handleAfterLoginFlows(action, listenerApi)

      expect(mockShowAlert).not.toHaveBeenCalled()
      expect(mockCapture).not.toHaveBeenCalled()
    })

    it('should skip notification prompt when user already prompted and prompt is blocked by feature flag', async () => {
      ;(selectHasBeenViewedOnce as jest.Mock).mockReturnValue(() => true)
      ;(selectIsEnableNotificationPromptBlocked as jest.Mock).mockReturnValue(
        true
      )
      mockGetNotificationSettings.mockResolvedValue(AuthorizationStatus.DENIED)

      const listenerApi = createListenerApi()
      await handleAfterLoginFlows(action, listenerApi)

      expect(mockShowAlert).not.toHaveBeenCalled()
    })
  })

  describe('silent turn-on for already authorized users', () => {
    it('should silently turn on notifications when permissions are already authorized', async () => {
      mockGetNotificationSettings.mockResolvedValue(
        AuthorizationStatus.AUTHORIZED
      )

      const listenerApi = createListenerApi()
      await handleAfterLoginFlows(action, listenerApi)

      expect(listenerApi.dispatch).toHaveBeenCalledWith(TURN_ON_ALL_ACTION)
      expect(mockShowAlert).not.toHaveBeenCalled()
    })

    it('should silently turn on notifications when permissions are provisional', async () => {
      mockGetNotificationSettings.mockResolvedValue(
        AuthorizationStatus.PROVISIONAL
      )

      const listenerApi = createListenerApi()
      await handleAfterLoginFlows(action, listenerApi)

      expect(listenerApi.dispatch).toHaveBeenCalledWith(TURN_ON_ALL_ACTION)
      expect(mockShowAlert).not.toHaveBeenCalled()
    })

    it('should capture PushNotificationAccepted for Android users on API < 33', async () => {
      const originalPlatform = Platform.OS
      const originalVersion = Platform.Version

      Object.defineProperty(Platform, 'OS', { value: 'android' })
      Object.defineProperty(Platform, 'Version', { value: 30 })

      mockGetNotificationSettings.mockResolvedValue(
        AuthorizationStatus.AUTHORIZED
      )

      const listenerApi = createListenerApi()
      await handleAfterLoginFlows(action, listenerApi)

      expect(mockCapture).toHaveBeenCalledWith('PushNotificationAccepted')
      expect(listenerApi.dispatch).toHaveBeenCalledWith(TURN_ON_ALL_ACTION)

      Object.defineProperty(Platform, 'OS', { value: originalPlatform })
      Object.defineProperty(Platform, 'Version', { value: originalVersion })
    })

    it('should NOT capture PushNotificationAccepted for Android users on API >= 33', async () => {
      const originalPlatform = Platform.OS
      const originalVersion = Platform.Version

      Object.defineProperty(Platform, 'OS', { value: 'android' })
      Object.defineProperty(Platform, 'Version', { value: 33 })

      mockGetNotificationSettings.mockResolvedValue(
        AuthorizationStatus.AUTHORIZED
      )

      const listenerApi = createListenerApi()
      await handleAfterLoginFlows(action, listenerApi)

      expect(mockCapture).not.toHaveBeenCalledWith('PushNotificationAccepted')

      Object.defineProperty(Platform, 'OS', { value: originalPlatform })
      Object.defineProperty(Platform, 'Version', { value: originalVersion })
    })

    it('should NOT capture PushNotificationAccepted for iOS users with granted permissions', async () => {
      const originalPlatform = Platform.OS

      Object.defineProperty(Platform, 'OS', { value: 'ios' })

      mockGetNotificationSettings.mockResolvedValue(
        AuthorizationStatus.AUTHORIZED
      )

      const listenerApi = createListenerApi()
      await handleAfterLoginFlows(action, listenerApi)

      expect(mockCapture).not.toHaveBeenCalledWith('PushNotificationAccepted')

      Object.defineProperty(Platform, 'OS', { value: originalPlatform })
    })
  })

  describe('notification prompt shown', () => {
    it('should capture PushNotificationPromptShown when showing the alert', async () => {
      mockGetNotificationSettings.mockResolvedValue(
        AuthorizationStatus.NOT_DETERMINED
      )
      mockShowAlert.mockImplementation(({ buttons }) => {
        const notNow = (buttons as AlertButton[]).find(
          b => b.text === 'Not now'
        )
        notNow?.onPress?.()
      })

      const listenerApi = createListenerApi()
      await handleAfterLoginFlows(action, listenerApi)

      expect(mockCapture).toHaveBeenCalledWith('PushNotificationPromptShown')
    })
  })

  describe('"Not now" button', () => {
    it('should capture PushNotificationRejected and resolve the promise', async () => {
      mockGetNotificationSettings.mockResolvedValue(
        AuthorizationStatus.NOT_DETERMINED
      )
      mockShowAlert.mockImplementation(({ buttons }) => {
        const notNow = (buttons as AlertButton[]).find(
          b => b.text === 'Not now'
        )
        notNow?.onPress?.()
      })

      const listenerApi = createListenerApi()
      await handleAfterLoginFlows(action, listenerApi)

      expect(mockCapture).toHaveBeenCalledWith('PushNotificationRejected')
      expect(listenerApi.dispatch).not.toHaveBeenCalledWith(TURN_ON_ALL_ACTION)
    })
  })

  describe('"Turn on" button', () => {
    it('should open system settings and resolve when status is DENIED (previously denied)', async () => {
      mockGetNotificationSettings.mockResolvedValue(AuthorizationStatus.DENIED)
      ;(selectHasBeenViewedOnce as jest.Mock).mockReturnValue(() => false)
      ;(selectIsEnableNotificationPromptBlocked as jest.Mock).mockReturnValue(
        false
      )

      mockShowAlert.mockImplementation(({ buttons }) => {
        const turnOn = (buttons as AlertButton[]).find(
          b => b.text === 'Turn on'
        )
        turnOn?.onPress?.()
      })

      const listenerApi = createListenerApi()
      await handleAfterLoginFlows(action, listenerApi)

      expect(mockOpenSystemSettings).toHaveBeenCalled()
      expect(mockGetAllPermissions).not.toHaveBeenCalled()
      expect(listenerApi.dispatch).not.toHaveBeenCalledWith(TURN_ON_ALL_ACTION)
    })

    it('should capture PushNotificationRejected when OS prompt is rejected (NOT_DETERMINED -> user declines)', async () => {
      mockGetNotificationSettings.mockResolvedValue(
        AuthorizationStatus.NOT_DETERMINED
      )
      mockGetAllPermissions.mockResolvedValue({ permission: 'denied' })

      mockShowAlert.mockImplementation(({ buttons }) => {
        const turnOn = (buttons as AlertButton[]).find(
          b => b.text === 'Turn on'
        )
        turnOn?.onPress?.()
      })

      const listenerApi = createListenerApi()
      await handleAfterLoginFlows(action, listenerApi)

      expect(mockGetAllPermissions).toHaveBeenCalledWith(false)
      expect(mockCapture).toHaveBeenCalledWith('PushNotificationRejected')
      expect(mockOpenSystemSettings).not.toHaveBeenCalled()
      expect(listenerApi.dispatch).not.toHaveBeenCalledWith(TURN_ON_ALL_ACTION)
    })

    it('should turn on notifications and capture PushNotificationAccepted when OS prompt is accepted', async () => {
      mockGetNotificationSettings.mockResolvedValue(
        AuthorizationStatus.NOT_DETERMINED
      )
      mockGetAllPermissions.mockResolvedValue({ permission: 'authorized' })

      mockShowAlert.mockImplementation(({ buttons }) => {
        const turnOn = (buttons as AlertButton[]).find(
          b => b.text === 'Turn on'
        )
        turnOn?.onPress?.()
      })

      const listenerApi = createListenerApi()
      await handleAfterLoginFlows(action, listenerApi)

      expect(listenerApi.dispatch).toHaveBeenCalledWith(TURN_ON_ALL_ACTION)
      expect(mockCapture).toHaveBeenCalledWith('PushNotificationAccepted')
    })
  })
})
