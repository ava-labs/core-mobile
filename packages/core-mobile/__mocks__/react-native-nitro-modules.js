// Mock for react-native-nitro-modules in Jest environment
// Required because react-native-mmkv v4+ imports nitro-modules at the top level,
// before the isTest() check can return the mock MMKV instance.
// This is a known limitation of react-native-mmkv's architecture.

const mockHybridObject = {
  name: 'MockHybridObject',
  dispose: jest.fn(),
  equals: jest.fn(() => false)
}

module.exports = {
  NitroModules: {
    createHybridObject: jest.fn(() => mockHybridObject),
    hasHybridObject: jest.fn(() => false)
  },
  getHybridObjectConstructor: jest.fn(() => jest.fn(() => mockHybridObject)),
  HybridObject: class HybridObject {},
  BoxedHybridObject: class BoxedHybridObject {},
  AnyHybridObject: class AnyHybridObject {},
  AnyMap: class AnyMap extends Map {},
  HybridView: jest.fn(),
  getHostComponent: jest.fn()
}
