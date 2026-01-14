import Config from 'react-native-config'
import { appCheckPostJson } from 'utils/api/common/appCheckFetch'
import { NewsChannelId } from '../channels'
import { unSubscribeForNews } from './unsubscribeForNews'
import { channelIdToNewsEventMap } from './events'

jest.mock('utils/api/common/appCheckFetch', () => ({
  appCheckPostJson: jest.fn()
}))

const mockAppCheckPostJson = appCheckPostJson as jest.Mock

describe('unSubscribeForNews', () => {
  const deviceArn =
    'arn:aws:sns:us-east-1:975050371175:endpoint/GCM/notification_sender/30516cb9-c9da-3455-8940-8a0470910005'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call fetch with a single unsubscribe event and handle a successful response ', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        message: 'ok'
      })
    }
    mockAppCheckPostJson.mockResolvedValue(mockResponse)

    const result = await unSubscribeForNews({
      deviceArn,
      channelIds: [NewsChannelId.MARKET_NEWS]
    })

    // Check if appCheckPostJson was called with correct URL and body
    expect(mockAppCheckPostJson).toHaveBeenCalledWith(
      Config.NOTIFICATION_SENDER_API_URL + '/v1/push/news/unsubscribe',
      JSON.stringify({
        deviceArn,
        events: [channelIdToNewsEventMap.marketNews]
      })
    )

    // Check if the response was handled correctly
    expect(result).toEqual({
      message: 'ok'
    })
  })

  it('should call fetch without event type to unsubscribe all news events and handle a successful response ', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        message: 'ok'
      })
    }
    mockAppCheckPostJson.mockResolvedValue(mockResponse)

    const result = await unSubscribeForNews({
      deviceArn,
      channelIds: []
    })

    // Check if appCheckPostJson was called with correct URL and body
    expect(mockAppCheckPostJson).toHaveBeenCalledWith(
      Config.NOTIFICATION_SENDER_API_URL + '/v1/push/news/unsubscribe',
      JSON.stringify({
        deviceArn,
        events: []
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
      unSubscribeForNews({ deviceArn, channelIds: [] })
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
      unSubscribeForNews({ deviceArn, channelIds: [] })
    ).rejects.toThrow('404:not found')
  })
})
