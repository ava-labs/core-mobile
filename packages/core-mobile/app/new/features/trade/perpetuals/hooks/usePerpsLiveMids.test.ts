import { renderHook } from '@testing-library/react-hooks'
import { usePerpsLiveMidsFeed } from './usePerpsLiveMids'

const mockPerpsContext = { wsResubscribeNonce: 0 }
const mockInfoClient = {
  getAllMids: jest.fn().mockResolvedValue({ BTC: '100' }),
  getPerpDexs: jest.fn().mockResolvedValue([])
}
const mockWsInstances: Array<{
  connect: jest.Mock
  disconnect: jest.Mock
  subscribe: jest.Mock
}> = []

jest.mock('../contexts/PerpsProvider', () => ({
  usePerps: () => mockPerpsContext
}))

jest.mock('../services/perpsClients', () => ({
  getPerpsInfoClient: () => mockInfoClient,
  createPerpsWsClient: jest.fn(() => {
    const ws = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      subscribe: jest.fn(() => jest.fn())
    }
    mockWsInstances.push(ws)
    return ws
  })
}))

jest.mock('@avalabs/perps-sdk', () => ({
  midForCoin: (mids: Record<string, string>, coin: string) => mids[coin],
  namespacedCoin: (dex: string, coin: string) => `${dex}:${coin}`,
  parseAllMidsWsPayload: (payload: unknown) => payload
}))

describe('usePerpsLiveMidsFeed', () => {
  beforeEach(() => {
    mockPerpsContext.wsResubscribeNonce = 0
    mockInfoClient.getAllMids.mockClear()
    mockInfoClient.getPerpDexs.mockClear()
    mockWsInstances.length = 0
  })

  it('shares one socket until the final consumer unmounts', () => {
    const first = renderHook(() => usePerpsLiveMidsFeed())
    const second = renderHook(() => usePerpsLiveMidsFeed())

    expect(mockWsInstances).toHaveLength(1)
    expect(mockWsInstances[0]?.connect).toHaveBeenCalledTimes(1)

    first.unmount()
    expect(mockWsInstances[0]?.disconnect).not.toHaveBeenCalled()

    second.unmount()
    expect(mockWsInstances[0]?.disconnect).toHaveBeenCalledTimes(1)
  })

  it('replaces the shared socket once when reconnecting', () => {
    const first = renderHook(() => usePerpsLiveMidsFeed())
    const second = renderHook(() => usePerpsLiveMidsFeed())

    mockPerpsContext.wsResubscribeNonce = 1
    first.rerender()
    second.rerender()

    expect(mockWsInstances).toHaveLength(2)
    expect(mockWsInstances[0]?.disconnect).toHaveBeenCalledTimes(1)
    expect(mockWsInstances[1]?.connect).toHaveBeenCalledTimes(1)

    first.unmount()
    expect(mockWsInstances[1]?.disconnect).not.toHaveBeenCalled()
    second.unmount()
    expect(mockWsInstances[1]?.disconnect).toHaveBeenCalledTimes(1)
  })
})
