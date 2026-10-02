// The real kit reaches @solana/web3.js, whose legacy CJS entry pulls in
// rpc-websockets and fails to resolve under the React Native jest resolver.
// @avalabs/core-wallets-sdk imports this kit at module load, so without this
// mock every suite that touches the SDK fails before a single test runs.
// SignerSolanaBuilder is the only export the SDK uses.
const getAddress = jest.fn(() => ({
  observable: {
    subscribe: jest.fn(),
    pipe: jest.fn()
  }
}))

module.exports = {
  __esModule: true,
  SignerSolanaBuilder: jest.fn(() => ({
    build: jest.fn(() => ({
      getAddress,
      signTransaction: jest.fn(),
      signMessage: jest.fn(),
      getAppConfiguration: jest.fn()
    }))
  }))
}
