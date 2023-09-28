import { openURL } from './openURL'

const mockCanOpenURL = jest.fn()
const mockOpenURL = jest.fn()
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: mockOpenURL,
  canOpenURL: mockCanOpenURL
}))

describe('openURL', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should have called Linking.openURL', async () => {
    mockCanOpenURL.mockResolvedValueOnce(true)
    const url = 'https://core.app'
    await openURL(url)
    expect(mockOpenURL).toHaveBeenCalledWith(url)
  })
  it('should not have called Linking.openURL when url is undefined', async () => {
    await openURL(undefined)
    expect(mockOpenURL).not.toHaveBeenCalled()
  })
  it('should not have called Linking.openURL when url is invalid url', async () => {
    await openURL('https://____coreeee____.app/')
    expect(mockOpenURL).not.toHaveBeenCalled()
  })
})
