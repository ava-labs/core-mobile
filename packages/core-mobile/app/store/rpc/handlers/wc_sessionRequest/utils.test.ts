import {
  AvalancheCaip2ChainId,
  BitcoinCaip2ChainId,
  SolanaCaip2ChainId
} from '@avalabs/core-chains-sdk'
import { SiteScanResponse } from 'services/blockaid/types'
import {
  isCoreMethod,
  isCoreDomain,
  getAddressForChainId,
  getScanUrl,
  assessDappTrust,
  DappTrustLevel,
  VerifyContext
} from './utils'

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

describe('getScanUrl', () => {
  const makeVerifyContext = (
    origin: string,
    validation: 'UNKNOWN' | 'VALID' | 'INVALID' = 'UNKNOWN'
  ): VerifyContext =>
    ({
      verified: { origin, validation, verifyUrl: '' }
    } as VerifyContext)

  it('should use the attested origin over the spoofable metadata url', () => {
    const result = getScanUrl(
      makeVerifyContext('https://evil.com', 'INVALID'),
      'https://core.app'
    )
    expect(result).toEqual('https://evil.com')
  })

  it('should fall back to the metadata url when Verify provides no origin', () => {
    expect(getScanUrl(makeVerifyContext(''), 'https://traderjoe.xyz')).toEqual(
      'https://traderjoe.xyz'
    )
    expect(
      getScanUrl(makeVerifyContext('   '), 'https://traderjoe.xyz')
    ).toEqual('https://traderjoe.xyz')
  })

  it('should fall back to the metadata url when verifyContext is undefined', () => {
    expect(getScanUrl(undefined, 'https://traderjoe.xyz')).toEqual(
      'https://traderjoe.xyz'
    )
  })
})

describe('assessDappTrust', () => {
  const makeVerifyContext = (
    origin: string,
    validation: 'UNKNOWN' | 'VALID' | 'INVALID' = 'UNKNOWN',
    isScam?: boolean
  ): VerifyContext =>
    ({
      verified: { origin, validation, verifyUrl: '', isScam }
    } as VerifyContext)

  const maliciousScan: SiteScanResponse = {
    status: 'hit',
    is_malicious: true
  } as SiteScanResponse

  const cleanScan: SiteScanResponse = {
    status: 'hit',
    is_malicious: false
  } as SiteScanResponse

  it('flags MALICIOUS when WC Verify marks the dApp as a scam', () => {
    const result = assessDappTrust({
      verifyContext: makeVerifyContext('https://scam.xyz', 'VALID', true),
      metadataUrl: 'https://scam.xyz'
    })
    expect(result.level).toBe(DappTrustLevel.MALICIOUS)
    expect(result.reasons[0]).toMatch(/scam/i)
  })

  it('flags MALICIOUS when Blockaid reports the site malicious', () => {
    const result = assessDappTrust({
      verifyContext: makeVerifyContext('https://evil.com', 'VALID'),
      metadataUrl: 'https://evil.com',
      scanResponse: maliciousScan
    })
    expect(result.level).toBe(DappTrustLevel.MALICIOUS)
  })

  it('flags SUSPICIOUS when WC validation is INVALID (spoofed origin)', () => {
    const result = assessDappTrust({
      verifyContext: makeVerifyContext('https://evil.com', 'INVALID'),
      metadataUrl: 'https://core.app'
    })
    expect(result.level).toBe(DappTrustLevel.SUSPICIOUS)
  })

  it('flags SUSPICIOUS when metadata url does not match the attested origin', () => {
    const result = assessDappTrust({
      verifyContext: makeVerifyContext('https://evil.com', 'UNKNOWN'),
      metadataUrl: 'https://core.app'
    })
    expect(result.level).toBe(DappTrustLevel.SUSPICIOUS)
    expect(result.originMismatch).toBe(true)
  })

  it('does NOT flag apex vs subdomain of the same site as a mismatch', () => {
    const result = assessDappTrust({
      verifyContext: makeVerifyContext('https://app.uniswap.org', 'UNKNOWN'),
      metadataUrl: 'https://uniswap.org',
      scanResponse: cleanScan
    })
    expect(result.originMismatch).toBe(false)
    // Not VALID → the origin is not authenticated, so still UNVERIFIED.
    expect(result.level).toBe(DappTrustLevel.UNVERIFIED)
  })

  it('is UNVERIFIED when the scan failed', () => {
    const result = assessDappTrust({
      verifyContext: makeVerifyContext('https://traderjoe.xyz', 'VALID'),
      metadataUrl: 'https://traderjoe.xyz',
      scanFailed: true
    })
    expect(result.level).toBe(DappTrustLevel.UNVERIFIED)
  })

  // The exact on-device finding: WalletConnect echoes the attacker's
  // metadata.url into `origin` under UNKNOWN validation. The URL may be shown
  // (so legit unverified dApps aren't blinded) but MUST NOT be marked verified.
  it('does NOT mark an UNKNOWN-validation origin as verified (WC echoes spoofable metadata into it)', () => {
    const result = assessDappTrust({
      verifyContext: makeVerifyContext('https://core.app', 'UNKNOWN'),
      metadataUrl: 'https://core.app'
    })
    expect(result.originAttested).toBe(false)
    expect(result.displayUrl).toBe('https://core.app')
    expect(result.level).toBe(DappTrustLevel.UNVERIFIED)
  })

  it('marks the origin as verified ONLY when validation is VALID', () => {
    const result = assessDappTrust({
      verifyContext: makeVerifyContext('https://uniswap.org', 'VALID'),
      metadataUrl: 'https://uniswap.org',
      scanResponse: cleanScan
    })
    expect(result.displayUrl).toBe('https://uniswap.org')
    expect(result.originAttested).toBe(true)
    expect(result.level).toBe(DappTrustLevel.TRUSTED)
  })

  it('does NOT mark the identity verified under INVALID validation', () => {
    const result = assessDappTrust({
      verifyContext: makeVerifyContext('https://evil.com', 'INVALID'),
      metadataUrl: 'https://core.app'
    })
    expect(result.originAttested).toBe(false)
    expect(result.level).toBe(DappTrustLevel.SUSPICIOUS)
  })

  // A self-declared URL is shown so legit unverified dApps aren't blinded, but
  // it is never marked verified — regardless of what brand it claims to be.
  it('shows the self-reported URL but marks it unverified when no VALID attestation', () => {
    const result = assessDappTrust({
      verifyContext: makeVerifyContext('', 'UNKNOWN'),
      metadataUrl: 'https://traderjoe.xyz',
      scanResponse: cleanScan
    })
    expect(result.displayUrl).toBe('https://traderjoe.xyz')
    expect(result.originAttested).toBe(false)
    expect(result.originMismatch).toBe(false)
    expect(result.level).toBe(DappTrustLevel.UNVERIFIED)
  })

  it('does NOT mark a Core-claiming metadata.url as verified when unattested', () => {
    const result = assessDappTrust({
      verifyContext: makeVerifyContext('', 'UNKNOWN'),
      metadataUrl: 'https://core.app'
    })
    expect(result.originAttested).toBe(false)
    expect(result.level).toBe(DappTrustLevel.UNVERIFIED)
  })

  it('does NOT mark a uniswap-claiming metadata.url as verified when unattested', () => {
    const result = assessDappTrust({
      verifyContext: makeVerifyContext('', 'UNKNOWN'),
      metadataUrl: 'https://uniswap.org'
    })
    expect(result.originAttested).toBe(false)
    expect(result.level).toBe(DappTrustLevel.UNVERIFIED)
  })

  it('flags UNVERIFIED when verifyContext is undefined (URL shown, not verified)', () => {
    const result = assessDappTrust({
      verifyContext: undefined,
      metadataUrl: 'https://traderjoe.xyz',
      scanResponse: cleanScan
    })
    expect(result.originAttested).toBe(false)
    expect(result.displayUrl).toBe('https://traderjoe.xyz')
    expect(result.level).toBe(DappTrustLevel.UNVERIFIED)
  })

  it('prioritizes MALICIOUS over SUSPICIOUS signals', () => {
    const result = assessDappTrust({
      verifyContext: makeVerifyContext('https://evil.com', 'INVALID', true),
      metadataUrl: 'https://core.app',
      scanResponse: maliciousScan
    })
    expect(result.level).toBe(DappTrustLevel.MALICIOUS)
  })
})
