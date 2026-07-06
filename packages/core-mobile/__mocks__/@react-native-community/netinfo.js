export default {
  configure: jest.fn(),
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(),
  useNetInfo: jest.fn(() => ({
    isConnected: true,
    isInternetReachable: true
  }))
}
