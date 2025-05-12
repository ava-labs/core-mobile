export const router = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  setParams: jest.fn(),
  _reset: () => {
    router.push.mockReset()
    router.back.mockReset()
    router.replace.mockReset()
    router.setParams.mockReset()
  },
  navigate: jest.fn()
}
