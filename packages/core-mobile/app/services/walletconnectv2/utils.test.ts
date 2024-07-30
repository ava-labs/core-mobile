import { addNamespaceToChain, addNamespaceToAddress } from './utils'

describe('addNamespaceToChain', () => {
  it('should add eip155 namespace to a chainId', () => {
    const chainId = 1
    const result = addNamespaceToChain(chainId)
    expect(result).toBe('eip155:1')
  })
})

describe('addNamespaceToAddress', () => {
  it('should add eip155 and chainId to an address', () => {
    const address = '0x1234567890abcdef'
    const chainId = 1
    const result = addNamespaceToAddress(address, chainId)
    expect(result).toBe('eip155:1:0x1234567890abcdef')
  })
})
