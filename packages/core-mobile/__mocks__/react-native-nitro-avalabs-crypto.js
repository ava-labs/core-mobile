module.exports = {
  secp256k1: {
    sign: jest.fn(),
    verify: jest.fn()
  },
  sha256: jest.fn(),
  randomBytes: jest.fn()
}
