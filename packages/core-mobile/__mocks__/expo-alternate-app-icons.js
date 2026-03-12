module.exports = {
  getAppIconName: jest.fn(() => null),
  setAlternateAppIcon: jest.fn(() => Promise.resolve(null)),
  supportsAlternateIcons: true
}
