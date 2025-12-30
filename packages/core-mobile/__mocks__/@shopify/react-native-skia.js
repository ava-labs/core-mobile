jest.mock('@shopify/react-native-skia', () => ({
  Canvas: 'Canvas',
  Circle: 'Circle',
  Group: 'Group',
  Path: 'Path',
  Rect: 'Rect',
  Skia: {},
  useFont: jest.fn(),
  useImage: jest.fn()
}))
