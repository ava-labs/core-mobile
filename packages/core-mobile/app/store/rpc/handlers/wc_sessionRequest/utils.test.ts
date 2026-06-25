import {
  AvalancheCaip2ChainId,
  BitcoinCaip2ChainId,
  SolanaCaip2ChainId
} from '@avalabs/core-chains-sdk'
import { isCoreMethod, isCoreDomain, getAddressForChainId } from './utils'

const mockAccount = {
  addressC: '0xC000',
  addressBTC: 'bc1qtest',
  addressAVM: 'X-avax1abc',
  addressPVM: 'P-avax1abc',
  addressCoreEth: '0xC000',
  addressSVM: 'So1ana1abc'
}

describe('getAddressForChainId', () => {
  it('returns addressC for AvalancheCaip2ChainId.C', () => {
    expect(getAddressForChainId(AvalancheCaip2ChainId.C, mockAccount)).toBe(
      '0xC000'
    )
  })

  it('returns addressC for AvalancheCaip2ChainId.C_TESTNET', () => {
    expect(
      getAddressForChainId(AvalancheCaip2ChainId.C_TESTNET, mockAccount)
    ).toBe('0xC000')
  })

  it('returns addressAVM for AvalancheCaip2ChainId.X', () => {
    expect(getAddressForChainId(AvalancheCaip2ChainId.X, mockAccount)).toBe(
      'X-avax1abc'
    )
  })

  it('returns addressPVM for AvalancheCaip2ChainId.P', () => {
    expect(getAddressForChainId(AvalancheCaip2ChainId.P, mockAccount)).toBe(
      'P-avax1abc'
    )
  })

  it('returns addressBTC for BitcoinCaip2ChainId.MAINNET', () => {
    expect(getAddressForChainId(BitcoinCaip2ChainId.MAINNET, mockAccount)).toBe(
      'bc1qtest'
    )
  })

  it('returns addressSVM for SolanaCaip2ChainId.MAINNET', () => {
    expect(getAddressForChainId(SolanaCaip2ChainId.MAINNET, mockAccount)).toBe(
      'So1ana1abc'
    )
  })

  it('returns addressC for eip155:43114 (EVM default)', () => {
    expect(getAddressForChainId('eip155:43114', mockAccount)).toBe('0xC000')
  })

  it('returns addressC for eip155:1 (EVM default)', () => {
    expect(getAddressForChainId('eip155:1', mockAccount)).toBe('0xC000')
  })
})

describe('isCoreMethod', () => {
  it('should return true if method is a Core method', () => {
    const methods = [
      'avalanche_sendTransaction',
      'avalanche_signTransaction',
      'avalanche_signMessage',
      'bitcoin_sendTransaction',
      'bitcoin_signTransaction'
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
      'personal_sign'
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
      'https://staging.core.app',
      'https://develop.core.app',
      'https://d0ce77c0-core-web-dev.avalabs.workers.dev',
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
      'http://dnoiacbfkodekgkjbpoagaljpbhaedmd/popup.html#/home', // wrong protocol
      // Unanchored-regex bypass attempts: attacker URL embeds the preview-deploy pattern in path/query/userinfo/subdomain
      'https://evil.com/?q=https://a-core-web-dev.avalabs.workers.dev',
      'https://evil.com/a-core-web-dev.avalabs.workers.dev',
      'https://a-core-web-dev.avalabs.workers.dev.evil.com',
      'https://a-core-web-dev.avalabs.workers.dev@evil.com',
      // Non-https core hostnames should not be trusted
      'http://core.app',
      'http://staging.core.app',
      'http://a-core-web-dev.avalabs.workers.dev'
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
