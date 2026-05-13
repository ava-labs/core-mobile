import {
  LedgerAppType,
  LedgerDerivationPathType,
  LedgerMultiIndexKeys,
  PublicKeyInfo,
  WalletSecretOperation
} from 'services/ledger/types'
import { Curve } from 'utils/publicKeys'
import {
  isBitcoinCompatibleApp,
  isVersionExceeding,
  getFormattedAddresses,
  buildKeysFromMultiIndex,
  buildLedgerWalletSecret,
  LedgerWalletSecretSchema
} from './index'

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
      expect(isBitcoinCompatibleApp(LedgerAppType.BITCOIN, '2.4.3')).toBe(false)
    })

    it('is not compatible when version exceeds the max (minor bump)', () => {
      expect(isBitcoinCompatibleApp(LedgerAppType.BITCOIN, '2.5.0')).toBe(false)
    })

    it('is not compatible when version exceeds the max (major bump)', () => {
      expect(isBitcoinCompatibleApp(LedgerAppType.BITCOIN, '3.0.0')).toBe(false)
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
      expect(isBitcoinCompatibleApp(LedgerAppType.UNKNOWN, '1.0.0')).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const makePk = (key: string, path = "m/44'/60'/0'/0/0"): PublicKeyInfo => ({
  key,
  derivationPath: path,
  curve: Curve.SECP256K1
})

const makeSolanaPk = (
  key: string,
  path = "m/44'/501'/0'/0'"
): PublicKeyInfo => ({
  key,
  derivationPath: path,
  curve: Curve.ED25519
})

const makeMultiIndexKeys = (indices: number[]): LedgerMultiIndexKeys => {
  const mainnet: LedgerMultiIndexKeys['mainnet'] = {}
  const testnet: LedgerMultiIndexKeys['testnet'] = {}

  for (const idx of indices) {
    mainnet[idx] = {
      avalancheKeys: {
        addresses: {
          evm: `0xEVM_${idx}`,
          avm: `X-avax1_${idx}`,
          pvm: `P-avax1_${idx}`,
          coreEth: `C-avax1_${idx}`,
          btc: `bc1_${idx}`
        },
        xpubs: {
          evm: `xpub_evm_${idx}`,
          avalanche: `xpub_avalanche_${idx}`
        },
        publicKeys: [makePk(`pk_mainnet_${idx}`)]
      },
      solanaKeys: [makeSolanaPk(`sol_${idx}`)]
    }

    testnet[idx] = {
      avalancheKeys: {
        addresses: {
          evm: `0xEVM_TEST_${idx}`,
          avm: `X-fuji1_${idx}`,
          pvm: `P-fuji1_${idx}`,
          coreEth: `C-fuji1_${idx}`,
          btc: `tb1_${idx}`
        },
        xpubs: {
          evm: `xpub_evm_test_${idx}`,
          avalanche: `xpub_avalanche_test_${idx}`
        },
        publicKeys: [makePk(`pk_testnet_${idx}`)]
      }
    }
  }

  return { mainnet, testnet }
}

// ---------------------------------------------------------------------------
// getFormattedAddresses
// ---------------------------------------------------------------------------

describe('getFormattedAddresses', () => {
  const normalAddresses = {
    evm: '0xAbC123',
    avm: 'X-avax1abc',
    pvm: 'P-avax1abc',
    btc: 'bc1qabc',
    coreEth: 'C-avax1abc'
  }

  it('passes through normal addresses unchanged', () => {
    expect(getFormattedAddresses(normalAddresses)).toEqual(normalAddresses)
  })

  it('fixes double 0x prefix on evm address', () => {
    const result = getFormattedAddresses({
      ...normalAddresses,
      evm: '0x0xAbC123'
    })
    expect(result.evm).toBe('0xAbC123')
  })

  it('fixes double 0x prefix on coreEth address', () => {
    const result = getFormattedAddresses({
      ...normalAddresses,
      coreEth: '0x0xCoreEth'
    })
    expect(result.coreEth).toBe('0xCoreEth')
  })

  it('leaves single 0x prefix on evm untouched', () => {
    const result = getFormattedAddresses({
      ...normalAddresses,
      evm: '0xSinglePrefix'
    })
    expect(result.evm).toBe('0xSinglePrefix')
  })

  it('leaves single 0x prefix on coreEth untouched', () => {
    const result = getFormattedAddresses({
      ...normalAddresses,
      coreEth: '0xSinglePrefix'
    })
    expect(result.coreEth).toBe('0xSinglePrefix')
  })

  it('passes avm, pvm, btc through without modification', () => {
    const result = getFormattedAddresses({
      evm: '0x0xDouble',
      avm: 'X-avax1unchanged',
      pvm: 'P-avax1unchanged',
      btc: 'bc1qunchanged',
      coreEth: '0x0xDouble'
    })
    expect(result.avm).toBe('X-avax1unchanged')
    expect(result.pvm).toBe('P-avax1unchanged')
    expect(result.btc).toBe('bc1qunchanged')
  })

  it('handles empty string addresses', () => {
    const result = getFormattedAddresses({
      evm: '',
      avm: '',
      pvm: '',
      btc: '',
      coreEth: ''
    })
    expect(result).toEqual({
      evm: '',
      avm: '',
      pvm: '',
      btc: '',
      coreEth: ''
    })
  })
})

// ---------------------------------------------------------------------------
// buildKeysFromMultiIndex
// ---------------------------------------------------------------------------

describe('buildKeysFromMultiIndex', () => {
  it('builds xpubs for BIP44 derivation path', () => {
    const multiIndexKeys = makeMultiIndexKeys([0, 1, 2])
    const { extendedPublicKeys } = buildKeysFromMultiIndex({
      multiIndexKeys,
      activeIndices: [0, 1, 2],
      derivationPathType: LedgerDerivationPathType.BIP44
    })

    expect(Object.keys(extendedPublicKeys)).toHaveLength(3)
    expect(extendedPublicKeys[0]).toEqual({
      evm: 'xpub_evm_0',
      avalanche: 'xpub_avalanche_0'
    })
    expect(extendedPublicKeys[2]).toEqual({
      evm: 'xpub_evm_2',
      avalanche: 'xpub_avalanche_2'
    })
  })

  it('omits xpubs for LedgerLive derivation path', () => {
    const multiIndexKeys = makeMultiIndexKeys([0, 1])
    const { extendedPublicKeys } = buildKeysFromMultiIndex({
      multiIndexKeys,
      activeIndices: [0, 1],
      derivationPathType: LedgerDerivationPathType.LedgerLive
    })

    expect(Object.keys(extendedPublicKeys)).toHaveLength(0)
  })

  it('collects mainnet, solana, and testnet public keys per index', () => {
    const multiIndexKeys = makeMultiIndexKeys([0])
    const { publicKeys } = buildKeysFromMultiIndex({
      multiIndexKeys,
      activeIndices: [0],
      derivationPathType: LedgerDerivationPathType.BIP44
    })

    const keys = publicKeys[0]!
    expect(keys).toBeDefined()
    // mainnet avalanche pk + solana pk + testnet avalanche pk = 3
    expect(keys).toHaveLength(3)
    expect(keys.map(k => k.key)).toEqual([
      'pk_mainnet_0',
      'sol_0',
      'pk_testnet_0'
    ])
  })

  it('deduplicates public keys with the same key value', () => {
    const multiIndexKeys = makeMultiIndexKeys([0])
    // Make testnet key identical to mainnet key
    multiIndexKeys.testnet[0]!.avalancheKeys!.publicKeys = [
      makePk('pk_mainnet_0')
    ]

    const { publicKeys } = buildKeysFromMultiIndex({
      multiIndexKeys,
      activeIndices: [0],
      derivationPathType: LedgerDerivationPathType.BIP44
    })

    const keyValues = publicKeys[0]!.map(k => k.key)
    expect(keyValues.filter(k => k === 'pk_mainnet_0')).toHaveLength(1)
  })

  it('handles indices where mainnet keys are missing', () => {
    const multiIndexKeys = makeMultiIndexKeys([0, 1])
    delete multiIndexKeys.mainnet[1]

    const { extendedPublicKeys, publicKeys } = buildKeysFromMultiIndex({
      multiIndexKeys,
      activeIndices: [0, 1],
      derivationPathType: LedgerDerivationPathType.BIP44
    })

    expect(extendedPublicKeys[0]).toBeDefined()
    expect(extendedPublicKeys[1]).toBeUndefined()
    // Testnet keys are still collected even when mainnet is missing
    expect(publicKeys[1]).toEqual([makePk('pk_testnet_1')])
  })

  it('only builds keys for requested activeIndices', () => {
    const multiIndexKeys = makeMultiIndexKeys([0, 1, 2, 3])
    const { extendedPublicKeys, publicKeys } = buildKeysFromMultiIndex({
      multiIndexKeys,
      activeIndices: [0, 2],
      derivationPathType: LedgerDerivationPathType.BIP44
    })

    expect(Object.keys(extendedPublicKeys).sort()).toEqual(['0', '2'])
    expect(Object.keys(publicKeys).sort()).toEqual(['0', '2'])
  })
})

// ---------------------------------------------------------------------------
// buildLedgerWalletSecret
// ---------------------------------------------------------------------------

describe('buildLedgerWalletSecret', () => {
  const basePk = makePk('pk_0')
  const solanaPk = makeSolanaPk('sol_0')

  describe('WalletSecretOperation.NEW', () => {
    it('includes base fields for BIP44', () => {
      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.NEW,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.BIP44,
          publicKeys: { 0: [basePk] }
        })
      )

      expect(result.deviceId).toBe('device-1')
      expect(result.deviceName).toBe('Nano X')
      expect(result.derivationPathSpec).toBe(LedgerDerivationPathType.BIP44)
    })

    it('includes extendedPublicKeys when provided for BIP44', () => {
      const xpubs = { 0: { evm: 'xpub_evm', avalanche: 'xpub_avax' } }
      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.NEW,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.BIP44,
          extendedPublicKeys: xpubs,
          publicKeys: { 0: [basePk] }
        })
      )

      expect(result.extendedPublicKeys).toEqual(xpubs)
    })

    it('omits extendedPublicKeys when not provided', () => {
      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.NEW,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.BIP44,
          publicKeys: { 0: [basePk] }
        })
      )

      expect(result.extendedPublicKeys).toBeUndefined()
    })

    it('omits extendedPublicKeys for LedgerLive', () => {
      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.NEW,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.LedgerLive,
          extendedPublicKeys: {
            0: { evm: 'xpub_evm', avalanche: 'xpub_avax' }
          },
          publicKeys: { 0: [basePk] }
        })
      )

      expect(result.extendedPublicKeys).toBeUndefined()
    })

    it('includes publicKeys verbatim', () => {
      const keys = { 0: [basePk], 1: [solanaPk] }
      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.NEW,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.BIP44,
          publicKeys: keys
        })
      )

      expect(result.publicKeys).toEqual(keys)
    })

    it('includes solanaAddresses when provided', () => {
      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.NEW,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.BIP44,
          publicKeys: { 0: [basePk] },
          solanaAddresses: { 1: 'SOL_ADDR_1', 2: 'SOL_ADDR_2' }
        })
      )

      expect(result.solanaAddresses).toEqual({
        '1': 'SOL_ADDR_1',
        '2': 'SOL_ADDR_2'
      })
    })

    it('omits solanaAddresses when empty', () => {
      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.NEW,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.BIP44,
          publicKeys: { 0: [basePk] },
          solanaAddresses: {}
        })
      )

      expect(result.solanaAddresses).toBeUndefined()
    })

    it('omits solanaAddresses when undefined', () => {
      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.NEW,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.BIP44,
          publicKeys: { 0: [basePk] }
        })
      )

      expect(result.solanaAddresses).toBeUndefined()
    })

    it('produces output parseable by LedgerWalletSecretSchema', () => {
      const secret = buildLedgerWalletSecret({
        type: WalletSecretOperation.NEW,
        deviceId: 'device-1',
        deviceName: 'Nano X',
        derivationPathType: LedgerDerivationPathType.BIP44,
        extendedPublicKeys: {
          0: { evm: 'xpub_evm', avalanche: 'xpub_avax' }
        },
        publicKeys: { 0: [basePk] }
      })

      expect(() =>
        LedgerWalletSecretSchema.parse(JSON.parse(secret))
      ).not.toThrow()
    })
  })

  describe('WalletSecretOperation.UPDATE', () => {
    const existingSecret = {
      deviceId: 'device-1',
      deviceName: 'Nano X',
      derivationPathSpec: LedgerDerivationPathType.BIP44,
      extendedPublicKeys: {
        0: { evm: 'xpub_evm_0', avalanche: 'xpub_avax_0' }
      },
      publicKeys: { 0: [basePk] },
      someExtraField: 'preserved'
    }

    it('preserves all existing wallet secret fields', () => {
      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.UPDATE,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.BIP44,
          existingWalletSecret: existingSecret,
          accountIndex: 1,
          newPublicKeys: [makePk('pk_1')],
          newXpubs: { evm: 'xpub_evm_1', avalanche: 'xpub_avax_1' }
        })
      )

      expect(result.someExtraField).toBe('preserved')
    })

    it('merges new xpubs into existing extendedPublicKeys for BIP44', () => {
      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.UPDATE,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.BIP44,
          existingWalletSecret: existingSecret,
          accountIndex: 1,
          newPublicKeys: [makePk('pk_1')],
          newXpubs: { evm: 'xpub_evm_1', avalanche: 'xpub_avax_1' }
        })
      )

      expect(result.extendedPublicKeys[0]).toEqual({
        evm: 'xpub_evm_0',
        avalanche: 'xpub_avax_0'
      })
      expect(result.extendedPublicKeys[1]).toEqual({
        evm: 'xpub_evm_1',
        avalanche: 'xpub_avax_1'
      })
    })

    it('does not add extendedPublicKeys for LedgerLive', () => {
      const ledgerLiveSecret = {
        ...existingSecret,
        derivationPathSpec: LedgerDerivationPathType.LedgerLive,
        extendedPublicKeys: undefined
      }

      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.UPDATE,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.LedgerLive,
          existingWalletSecret: ledgerLiveSecret,
          accountIndex: 1,
          newPublicKeys: [makePk('pk_1')],
          newXpubs: { evm: 'xpub_evm_1', avalanche: 'xpub_avax_1' }
        })
      )

      expect(result.extendedPublicKeys).toBeUndefined()
    })

    it('merges new public keys at the correct account index', () => {
      const newPk = makePk('pk_new_1')
      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.UPDATE,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.BIP44,
          existingWalletSecret: existingSecret,
          accountIndex: 1,
          newPublicKeys: [newPk]
        })
      )

      expect(result.publicKeys[0]).toEqual([basePk])
      expect(result.publicKeys[1]).toEqual([newPk])
    })

    it('includes Solana keys in the merged public keys', () => {
      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.UPDATE,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.BIP44,
          existingWalletSecret: existingSecret,
          accountIndex: 1,
          newPublicKeys: [makePk('pk_1')],
          newSolanaKeys: [solanaPk]
        })
      )

      const keys1 = result.publicKeys[1]
      expect(keys1).toHaveLength(2)
      expect(keys1.map((k: PublicKeyInfo) => k.key)).toContain('sol_0')
    })

    it('deduplicates public keys by key field', () => {
      const duplicatePk = makePk('pk_dup')
      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.UPDATE,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.BIP44,
          existingWalletSecret: existingSecret,
          accountIndex: 1,
          newPublicKeys: [duplicatePk, duplicatePk]
        })
      )

      expect(result.publicKeys[1]).toHaveLength(1)
    })

    it('produces output parseable by LedgerWalletSecretSchema', () => {
      const secret = buildLedgerWalletSecret({
        type: WalletSecretOperation.UPDATE,
        deviceId: 'device-1',
        deviceName: 'Nano X',
        derivationPathType: LedgerDerivationPathType.BIP44,
        existingWalletSecret: existingSecret,
        accountIndex: 1,
        newPublicKeys: [makePk('pk_1')],
        newXpubs: { evm: 'xpub_evm_1', avalanche: 'xpub_avax_1' }
      })

      expect(() =>
        LedgerWalletSecretSchema.parse(JSON.parse(secret))
      ).not.toThrow()
    })
  })

  describe('WalletSecretOperation.SOLANA_UPDATE', () => {
    const existingSecret = {
      deviceId: 'device-1',
      deviceName: 'Nano X',
      derivationPathSpec: LedgerDerivationPathType.BIP44,
      extendedPublicKeys: {
        0: { evm: 'xpub_evm_0', avalanche: 'xpub_avax_0' }
      },
      publicKeys: { 0: [basePk] }
    }

    it('preserves all existing wallet secret fields', () => {
      const secretWithExtra = { ...existingSecret, customField: 'keep' }
      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.SOLANA_UPDATE,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.BIP44,
          existingWalletSecret: secretWithExtra,
          accountIndex: 0,
          newSolanaKeys: [solanaPk]
        })
      )

      expect(result.customField).toBe('keep')
    })

    it('appends Solana keys to existing public keys at correct index', () => {
      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.SOLANA_UPDATE,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.BIP44,
          existingWalletSecret: existingSecret,
          accountIndex: 0,
          newSolanaKeys: [solanaPk]
        })
      )

      const keys0 = result.publicKeys[0]
      expect(keys0).toHaveLength(2)
      expect(keys0.map((k: PublicKeyInfo) => k.key)).toEqual(['pk_0', 'sol_0'])
    })

    it('does not touch public keys for other indices', () => {
      const multiAccountSecret = {
        ...existingSecret,
        publicKeys: {
          0: [basePk],
          1: [makePk('pk_1')]
        }
      }

      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.SOLANA_UPDATE,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.BIP44,
          existingWalletSecret: multiAccountSecret,
          accountIndex: 0,
          newSolanaKeys: [solanaPk]
        })
      )

      expect(result.publicKeys[1]).toEqual([makePk('pk_1')])
    })

    it('deduplicates if same Solana key added twice', () => {
      const secretWithSolana = {
        ...existingSecret,
        publicKeys: { 0: [basePk, solanaPk] }
      }

      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.SOLANA_UPDATE,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.BIP44,
          existingWalletSecret: secretWithSolana,
          accountIndex: 0,
          newSolanaKeys: [solanaPk]
        })
      )

      const solanaKeys = result.publicKeys[0].filter(
        (k: PublicKeyInfo) => k.key === 'sol_0'
      )
      expect(solanaKeys).toHaveLength(1)
    })

    it('does not modify extendedPublicKeys', () => {
      const result = JSON.parse(
        buildLedgerWalletSecret({
          type: WalletSecretOperation.SOLANA_UPDATE,
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.BIP44,
          existingWalletSecret: existingSecret,
          accountIndex: 0,
          newSolanaKeys: [solanaPk]
        })
      )

      expect(result.extendedPublicKeys).toEqual(
        existingSecret.extendedPublicKeys
      )
    })

    it('produces output parseable by LedgerWalletSecretSchema', () => {
      const secret = buildLedgerWalletSecret({
        type: WalletSecretOperation.SOLANA_UPDATE,
        deviceId: 'device-1',
        deviceName: 'Nano X',
        derivationPathType: LedgerDerivationPathType.BIP44,
        existingWalletSecret: existingSecret,
        accountIndex: 0,
        newSolanaKeys: [solanaPk]
      })

      expect(() =>
        LedgerWalletSecretSchema.parse(JSON.parse(secret))
      ).not.toThrow()
    })
  })

  describe('round-trip: NEW -> UPDATE -> SOLANA_UPDATE', () => {
    it('produces valid secret through sequential operations', () => {
      // Step 1: Create new wallet
      const newSecret = buildLedgerWalletSecret({
        type: WalletSecretOperation.NEW,
        deviceId: 'device-1',
        deviceName: 'Nano X',
        derivationPathType: LedgerDerivationPathType.BIP44,
        extendedPublicKeys: {
          0: { evm: 'xpub_evm_0', avalanche: 'xpub_avax_0' }
        },
        publicKeys: { 0: [basePk] }
      })

      const parsed1 = LedgerWalletSecretSchema.parse(JSON.parse(newSecret))
      expect(parsed1.deviceId).toBe('device-1')

      // Step 2: Add account 1
      const updatedSecret = buildLedgerWalletSecret({
        type: WalletSecretOperation.UPDATE,
        deviceId: 'device-1',
        deviceName: 'Nano X',
        derivationPathType: LedgerDerivationPathType.BIP44,
        existingWalletSecret: JSON.parse(newSecret),
        accountIndex: 1,
        newPublicKeys: [makePk('pk_1')],
        newXpubs: { evm: 'xpub_evm_1', avalanche: 'xpub_avax_1' }
      })

      const parsed2 = LedgerWalletSecretSchema.parse(JSON.parse(updatedSecret))
      expect(Object.keys(parsed2.extendedPublicKeys!)).toHaveLength(2)
      expect(Object.keys(parsed2.publicKeys)).toHaveLength(2)

      // Step 3: Add Solana to account 0
      const solanaSecret = buildLedgerWalletSecret({
        type: WalletSecretOperation.SOLANA_UPDATE,
        deviceId: 'device-1',
        deviceName: 'Nano X',
        derivationPathType: LedgerDerivationPathType.BIP44,
        existingWalletSecret: JSON.parse(updatedSecret),
        accountIndex: 0,
        newSolanaKeys: [solanaPk]
      })

      const parsed3 = LedgerWalletSecretSchema.parse(JSON.parse(solanaSecret))
      // Account 0 should now have original pk + solana pk
      expect(parsed3.publicKeys[0]).toHaveLength(2)
      // Account 1 should be untouched
      expect(parsed3.publicKeys[1]).toHaveLength(1)
      // Xpubs should still be intact
      expect(Object.keys(parsed3.extendedPublicKeys!)).toHaveLength(2)
    })
  })
})
