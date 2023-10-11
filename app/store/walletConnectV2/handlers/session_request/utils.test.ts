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
      'avalanche_sendTransaction',
      'avalanche_signTransaction'
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
      'https://some-feature.core-web.pages.dev',
      'https://ava-labs.github.io/extension-avalanche-playground/',
      'https://ava-labs.github.io/ab-cd'
    ]

    for (const url of urls) {
      const result = isCoreDomain(url)
      expect(result).toEqual(true)
    }
  })

  it('should return true if URL is a Core Extension url', () => {
    const urls = [
      'chrome-extension://agoakfejjabomempkjlepdflaleeobhb/popup.html#/home',
      'chrome-extension://dnoiacbfkodekgkjbpoagaljpbhaedmd/popup.html#/home'
    ]

    for (const url of urls) {
      const result = isCoreDomain(url)
      expect(result).toEqual(true)
    }
  })

  it('should return false if domain is not a Core domain nor a Core Extension URL', () => {
    const urls = [
      'https://google.com',
      'https://traderjoe.xyz',
      'https://app.uniswap.org',
      'https://av-la.github.io',
      'chrome-extension://dnoiacbfkodekidupaiagaljpbhaedmd/popup.html#/home', // wrong extension id
      'https://dnoiacbfkodekgkjbpoagaljpbhaedmd/popup.html#/home', // wrong protocol
      'http://dnoiacbfkodekgkjbpoagaljpbhaedmd/popup.html#/home' // wrong protocol
    ]

    for (const url of urls) {
      const result = isCoreDomain(url)
      expect(result).toEqual(false)
    }
  })

  it('should return false if url is invalid', () => {
    const urls = ['app.pangolin.exchange']

    for (const url of urls) {
      const result = isCoreDomain(url)
      expect(result).toEqual(false)
    }
  })
})
