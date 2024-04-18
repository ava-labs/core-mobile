jest.mock('react-native-quick-crypto', () => {
  return jest.requireActual('crypto')
})
