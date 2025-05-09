import { openInSystemBrowser } from './openInSystemBrowser'

const mockCanOpenURL = jest.fn()
const mockOpenURL = jest.fn()
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: mockOpenURL,
  canOpenURL: mockCanOpenURL
}))

describe('openInSystemBrowser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should have called Linking.openURL', async () => {
    mockCanOpenURL.mockResolvedValueOnce(true)
    const url = 'https://core.app'
    await openInSystemBrowser(url)
    expect(mockOpenURL).toHaveBeenCalledWith(url)
  })
  it('should not have called Linking.openURL when url is undefined', async () => {
    await openInSystemBrowser(undefined)
    expect(mockOpenURL).not.toHaveBeenCalled()
  })
  it('should not have called Linking.openURL when url is invalid url', async () => {
    await openInSystemBrowser('https://____coreeee____.app/')
    expect(mockOpenURL).not.toHaveBeenCalled()
  })
})
