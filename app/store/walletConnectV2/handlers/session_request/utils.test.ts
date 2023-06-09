import { isCoreMethod, isCoreDomain } from './utils'

describe('isCoreMethod', () => {
  it('should return true if method is a Core method', () => {
    const methods = [
      'avalanche_bridgeAsset',
      'avalanche_createContact',
      'avalanche_getAccounts',
      'avalanche_getAccountPubKey',
      'avalanche_getBridgeState',
      'avalanche_getContacts',
      'avalanche_removeContact',
      'avalanche_selectAccount',
      'avalanche_setDeveloperMode',
      'avalanche_updateContact',
      'avalanche_sendTransaction'
    ]

    for (const method of methods) {
      const result = isCoreMethod(method)
      expect(result).toEqual(true)
    }
  })

  it('should return false if method is not a Core method', () => {
    const methods = [
      '',
      'avalanche_something',
      'eth_signTypedData_v3',
      'session_request',
      'personal_sign',
      'wallet_switchEthereumChain'
    ]

    for (const method of methods) {
      const result = isCoreMethod(method)
      expect(result).toEqual(false)
    }
  })
})

describe('isCoreDomain', () => {
  it('should return true if domain is a Core domain', () => {
    const urls = [
      'http://127.0.0.1:1234',
      'http://localhost:1234',
      'https://core.app',
      'https://test.core.app',
      'https://ava-labs.github.io/',
      'https://some-feature.core-web.pages.dev'
    ]

    for (const url of urls) {
      const result = isCoreDomain(url)
      expect(result).toEqual(true)
    }
  })

  it('should return false if domain is not a Core domain', () => {
    const urls = [
      'https://google.com',
      'https://traderjoe.xyz',
      'https://app.uniswap.org'
    ]

    for (const url of urls) {
      const result = isCoreDomain(url)
      expect(result).toEqual(false)
    }
  })
})
