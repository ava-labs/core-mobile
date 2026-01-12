import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'
import Config from 'react-native-config'
import { Platform } from 'react-native'
import { commonStorage } from 'utils/mmkv'
import { StorageKey } from 'resources/Constants'
import { appCheckPostJson } from 'utils/api/common/appCheckFetch'

jest.mock('utils/api/common/appCheckFetch', () => ({
  appCheckPostJson: jest.fn()
}))

const mockAppCheckPostJson = appCheckPostJson as jest.Mock

describe('registerDevice', () => {
  const deviceToken =
    'fecLDIIWQoKNVxMA0uuvLk:APA91bEzX2xmiSigNGSpi4j4XiV_y7RXAloEvc1gFEJqxZufvbfyz-utPmSNwzhlp-7-53TC9o4xTjpG5Dc8EbYWD6R9rvSqo_9ss-jxF3eE8xQ-EuSBlEdtr4ci0L2h4XimKXxPRU4W'

  beforeEach(() => {
    jest.clearAllMocks()
    commonStorage.delete(StorageKey.NOTIFICATIONS_OPTIMIZATION)
  })

  it('should call fetch with the correct options and handle a successful response', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        deviceArn:
          'arn:aws:sns:us-east-1:975050371175:endpoint/GCM/notification_sender/30516cb9-c9da-3455-8940-8a0470910005'
      })
    }
    mockAppCheckPostJson.mockResolvedValue(mockResponse)

    const result = await registerDeviceToNotificationSender(deviceToken)

    // Check if appCheckPostJson was called with correct URL and body
    expect(mockAppCheckPostJson).toHaveBeenCalledWith(
      Config.NOTIFICATION_SENDER_API_URL + '/v1/push/register',
      JSON.stringify({
        deviceToken: deviceToken,
        appType: 'CORE_MOBILE_APP',
        osType: Platform.OS === 'ios' ? 'IOS' : 'ANDROID'
      })
    )

    // Check if the response was handled correctly
    expect(result).toEqual(
      'arn:aws:sns:us-east-1:975050371175:endpoint/GCM/notification_sender/30516cb9-c9da-3455-8940-8a0470910005'
    )
  })

  it('should store deviceArn in common store on successful register', async () => {
    let storedArn = commonStorage.getString(
      StorageKey.NOTIFICATIONS_OPTIMIZATION
    )
    expect(storedArn).toBe(undefined)

    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        deviceArn:
          'arn:aws:sns:us-east-1:975050371175:endpoint/GCM/notification_sender/30516cb9-c9da-3455-8940-8a0470910005'
      })
    }
    mockAppCheckPostJson.mockResolvedValue(mockResponse)

    await registerDeviceToNotificationSender(deviceToken)

    storedArn = commonStorage.getString(StorageKey.NOTIFICATIONS_OPTIMIZATION)
    expect(storedArn).toBe(
      'arn:aws:sns:us-east-1:975050371175:endpoint/GCM/notification_sender/30516cb9-c9da-3455-8940-8a0470910005'
    )
  })

  it('should throw an error if the fetch request fails', async () => {
    const mockError = new Error('Network error')
    mockAppCheckPostJson.mockRejectedValue(mockError)

    await expect(
      registerDeviceToNotificationSender(deviceToken)
    ).rejects.toThrow('Network error')
  })

  it('should throw an error if the response is not ok', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'not found'
    }
    mockAppCheckPostJson.mockResolvedValue(mockResponse)

    await expect(
      registerDeviceToNotificationSender(deviceToken)
    ).rejects.toThrow('404:not found')
  })
})
