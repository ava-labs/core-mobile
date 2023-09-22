import mockSession from 'tests/fixtures/walletConnect/session.json'
import {
  addNamespaceToChain,
  addNamespaceToAddress,
  chainAlreadyInSession,
  addressAlreadyInSession
} from './utils'

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

describe('chainAlreadyInSession', () => {
  it('should return true if the chainId is in the session', () => {
    mockSession.namespaces.eip155.chains = ['eip155:1']

    const chainId = 1
    const result = chainAlreadyInSession(mockSession, chainId)
    expect(result).toBe(true)
  })

  it('should return false if the chainId is not in the session', () => {
    mockSession.namespaces.eip155.chains = []

    const chainId = 2
    const result = chainAlreadyInSession(mockSession, chainId)
    expect(result).toBe(false)
  })
})

describe('addressAlreadyInSession', () => {
  it('should return true if the address is in the session', () => {
    mockSession.namespaces.eip155.accounts = ['eip155:1:0x1234567890abcdef']

    const address = 'eip155:1:0x1234567890abcdef'
    const result = addressAlreadyInSession(mockSession, address)
    expect(result).toBe(true)
  })

  it('should return false if the address is not in the session', () => {
    mockSession.namespaces.eip155.accounts = []

    const address = 'eip155:1:0x1234567890abcdef'
    const result = addressAlreadyInSession(mockSession, address)
    expect(result).toBe(false)
  })
})
