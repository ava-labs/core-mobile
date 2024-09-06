import { registerDeviceToNotificationSender } from 'services/notifications/balanceChange/registerDeviceToNotificationSender'
import Config from 'react-native-config'

global.fetch = jest.fn()

describe('registerDevice', () => {
  const deviceToken =
    'fecLDIIWQoKNVxMA0uuvLk:APA91bEzX2xmiSigNGSpi4j4XiV_y7RXAloEvc1gFEJqxZufvbfyz-utPmSNwzhlp-7-53TC9o4xTjpG5Dc8EbYWD6R9rvSqo_9ss-jxF3eE8xQ-EuSBlEdtr4ci0L2h4XimKXxPRU4W'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call fetch with the correct options and handle a successful response', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        deviceArn:
          'arn:aws:sns:us-east-1:975050371175:endpoint/GCM/notification_sender/30516cb9-c9da-3455-8940-8a0470910005'
      })
    }
    global.fetch = jest.fn(() => Promise.resolve(mockResponse)) as jest.Mock

    const result = await registerDeviceToNotificationSender(deviceToken)

    // Check if fetch was called with correct URL and options
    expect(fetch).toHaveBeenCalledWith(
      Config.NOTIFICATION_SENDER_API_URL + '/v1/push/register',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Firebase-AppCheck': 'appCheckToken'
        },
        body: JSON.stringify({
          deviceToken: deviceToken,
          appType: 'CORE_MOBILE_APP'
        })
      }
    )

    // Check if the response was handled correctly
    expect(result).toEqual({
      deviceArn:
        'arn:aws:sns:us-east-1:975050371175:endpoint/GCM/notification_sender/30516cb9-c9da-3455-8940-8a0470910005'
    })
  })

  it('should throw an error if the fetch request fails', async () => {
    const mockError = new Error('Network error')
    global.fetch = jest.fn(() => Promise.reject(mockError)) as jest.Mock

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
    global.fetch = jest.fn(() => Promise.resolve(mockResponse)) as jest.Mock

    await expect(
      registerDeviceToNotificationSender(deviceToken)
    ).rejects.toThrow('404:not found')
  })
})
