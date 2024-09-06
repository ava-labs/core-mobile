import { subscribeForBalanceChange } from 'services/notifications/balanceChange/subscribeForBalanceChange'
import Config from 'react-native-config'

global.fetch = jest.fn()

describe('subscribe', () => {
  const deviceArn =
    'arn:aws:sns:us-east-1:975050371175:endpoint/GCM/notification_sender/30516cb9-c9da-3455-8940-8a0470910005'
  const chainIds = ['43113']
  const addresses = ['0xbb2976DAEeA235BC99Ca75f6804740fDE74e79b9']

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call fetch with the correct options and handle a successful response', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        message: 'ok'
      })
    }
    global.fetch = jest.fn(() => Promise.resolve(mockResponse)) as jest.Mock

    const result = await subscribeForBalanceChange({
      deviceArn,
      chainIds,
      addresses
    })

    // Check if fetch was called with correct URL and options
    expect(fetch).toHaveBeenCalledWith(
      Config.NOTIFICATION_SENDER_API_URL + '/v1/push/balance-changes/subscribe',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Firebase-AppCheck': 'appCheckToken'
        },
        body: JSON.stringify({
          deviceArn,
          chainIds,
          addresses
        })
      }
    )

    // Check if the response was handled correctly
    expect(result).toEqual({
      message: 'ok'
    })
  })

  it('should throw an error if the fetch request fails', async () => {
    const mockError = new Error('Network error')
    global.fetch = jest.fn(() => Promise.reject(mockError)) as jest.Mock

    await expect(
      subscribeForBalanceChange({ deviceArn, chainIds, addresses })
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
      subscribeForBalanceChange({ deviceArn, chainIds, addresses })
    ).rejects.toThrow('404:not found')
  })
})
