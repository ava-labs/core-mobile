export default jest.fn().mockImplementation(() => ({
  evm: {
    transaction: {
      scan: jest.fn()
    }
  }
}))
