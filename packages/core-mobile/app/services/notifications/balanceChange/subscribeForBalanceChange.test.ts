import { subscribeForBalanceChange } from 'services/notifications/balanceChange/subscribeForBalanceChange'
import Config from 'react-native-config'
import { appCheckPostJson } from 'utils/api/common/appCheckFetch'

jest.mock('utils/api/common/appCheckFetch', () => ({
  appCheckPostJson: jest.fn()
}))

const mockAppCheckPostJson = appCheckPostJson as jest.Mock

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
      status: 200,
      json: jest.fn().mockResolvedValue({
        message: 'ok'
      })
    }
    mockAppCheckPostJson.mockResolvedValue(mockResponse)

    const result = await subscribeForBalanceChange({
      deviceArn,
      chainIds,
      addresses
    })

    // Check if appCheckPostJson was called with correct URL and body
    expect(mockAppCheckPostJson).toHaveBeenCalledWith(
      Config.NOTIFICATION_SENDER_API_URL + '/v1/push/balance-changes/subscribe',
      JSON.stringify({
        deviceArn,
        chainIds,
        addresses
      })
    )

    // Check if the response was handled correctly
    expect(result).toEqual({
      message: 'ok'
    })
  })

  it('should throw an error if the fetch request fails', async () => {
    const mockError = new Error('Network error')
    mockAppCheckPostJson.mockRejectedValue(mockError)

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
    mockAppCheckPostJson.mockResolvedValue(mockResponse)

    await expect(
      subscribeForBalanceChange({ deviceArn, chainIds, addresses })
    ).rejects.toThrow('404:not found')
  })
})
