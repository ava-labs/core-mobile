import { LedgerAppType } from 'services/ledger/types'
import { isBitcoinCompatibleApp, isVersionExceeding } from './index'

describe('isVersionExceeding', () => {
  describe('returns true when version exceeds maxVersion', () => {
    it('detects patch bump', () => {
      expect(isVersionExceeding('2.4.3', '2.4.2')).toBe(true)
    })

    it('detects minor bump', () => {
      expect(isVersionExceeding('2.5.0', '2.4.2')).toBe(true)
    })

    it('detects major bump', () => {
      expect(isVersionExceeding('3.0.0', '2.4.2')).toBe(true)
    })

    it('detects patch bump when minor is higher', () => {
      expect(isVersionExceeding('2.5.1', '2.4.9')).toBe(true)
    })
  })

  describe('returns false when version does not exceed maxVersion', () => {
    it('returns false for equal versions', () => {
      expect(isVersionExceeding('2.4.2', '2.4.2')).toBe(false)
    })

    it('returns false when patch is lower', () => {
      expect(isVersionExceeding('2.4.1', '2.4.2')).toBe(false)
    })

    it('returns false when minor is lower', () => {
      expect(isVersionExceeding('2.3.9', '2.4.2')).toBe(false)
    })

    it('returns false when major is lower', () => {
      expect(isVersionExceeding('1.9.9', '2.4.2')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles missing patch segment (shorter version)', () => {
      // '2.5' treated as '2.5.0', which exceeds '2.4.2'
      expect(isVersionExceeding('2.5', '2.4.2')).toBe(true)
    })

    it('handles missing patch segment equal to max', () => {
      // '2.4' treated as '2.4.0', which does not exceed '2.4.2'
      expect(isVersionExceeding('2.4', '2.4.2')).toBe(false)
    })

    it('handles extra patch segment', () => {
      // '2.4.2.1' treated as exceeding '2.4.2'
      expect(isVersionExceeding('2.4.2.1', '2.4.2')).toBe(true)
    })

    it('handles zero versions', () => {
      expect(isVersionExceeding('0.0.1', '0.0.0')).toBe(true)
      expect(isVersionExceeding('0.0.0', '0.0.0')).toBe(false)
    })
  })
})

describe('isBitcoinCompatibleApp', () => {
  describe('Bitcoin Recovery app', () => {
    it('is always compatible regardless of version', () => {
      expect(
        isBitcoinCompatibleApp(LedgerAppType.BITCOIN_RECOVERY, '1.0.0')
      ).toBe(true)
    })

    it('is compatible with empty version string', () => {
      expect(isBitcoinCompatibleApp(LedgerAppType.BITCOIN_RECOVERY, '')).toBe(
        true
      )
    })
  })

  describe('regular Bitcoin app', () => {
    it('is compatible when version is within the supported range', () => {
      expect(isBitcoinCompatibleApp(LedgerAppType.BITCOIN, '2.4.2')).toBe(true)
    })

    it('is compatible when version is below the max', () => {
      expect(isBitcoinCompatibleApp(LedgerAppType.BITCOIN, '2.4.1')).toBe(true)
    })

    it('is compatible when major version is lower', () => {
      expect(isBitcoinCompatibleApp(LedgerAppType.BITCOIN, '1.0.0')).toBe(true)
    })

    it('is not compatible when version exceeds the max (patch bump)', () => {
      expect(isBitcoinCompatibleApp(LedgerAppType.BITCOIN, '2.4.3')).toBe(
        false
      )
    })

    it('is not compatible when version exceeds the max (minor bump)', () => {
      expect(isBitcoinCompatibleApp(LedgerAppType.BITCOIN, '2.5.0')).toBe(
        false
      )
    })

    it('is not compatible when version exceeds the max (major bump)', () => {
      expect(isBitcoinCompatibleApp(LedgerAppType.BITCOIN, '3.0.0')).toBe(
        false
      )
    })
  })

  describe('other app types', () => {
    it('Ethereum app is not compatible', () => {
      expect(isBitcoinCompatibleApp(LedgerAppType.ETHEREUM, '1.0.0')).toBe(
        false
      )
    })

    it('Avalanche app is not compatible', () => {
      expect(isBitcoinCompatibleApp(LedgerAppType.AVALANCHE, '1.0.0')).toBe(
        false
      )
    })

    it('Solana app is not compatible', () => {
      expect(isBitcoinCompatibleApp(LedgerAppType.SOLANA, '1.0.0')).toBe(false)
    })

    it('Unknown app is not compatible', () => {
      expect(isBitcoinCompatibleApp(LedgerAppType.UNKNOWN, '1.0.0')).toBe(
        false
      )
    })
  })
})
