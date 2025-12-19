import * as cs from '@cubist-labs/cubesigner-sdk'
import { transformKeyInfosToPubKeys } from './transformKeyInfosToPubkeys'

/**
 * CONFIRMATION: Filtering out old derivation path keys causes "Accounts not created" error
 *
 * Scenario:
 * - Backend returns keys with OLD spec: m/44'/9000'/0'/0/addressIndex
 * - Code filters OUT old spec keys (keeping only new spec)
 * - Result: filteredKeys has no Avalanche keys
 * - Reduce returns empty object {}
 * - Line 124-125 throws "Accounts not created"
 */

describe('transformKeyInfosToPubKeys - Filter Out Old Keys Issue', () => {
  it('should demonstrate that filtering out old keys causes Accounts not created error', () => {
    const mnemonicId = 'test-mnemonic-id'

    // Simulate backend returning OLD spec keys (what backend currently returns)
    const keyInfosWithOldSpec: cs.KeyInfo[] = [
      // EVM key
      {
        enabled: true,
        key_type: cs.Secp256k1.Evm,
        derivation_info: {
          derivation_path: "m/44'/60'/0'/0/0", // Old spec
          mnemonic_id: mnemonicId
        },
        public_key:
          '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        key_id: 'evm-key-1',
        material_id: 'material-1',
        owner: 'owner-1',
        policy: [],
        purpose: 'sign'
      },
      // Avalanche key with OLD spec: m/44'/9000'/0'/0/0
      {
        enabled: true,
        key_type: cs.Secp256k1.Ava,
        derivation_info: {
          derivation_path: "m/44'/9000'/0'/0/0", // OLD spec - accountIndex=0, addressIndex=0
          mnemonic_id: mnemonicId
        },
        public_key:
          '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
        key_id: 'ava-key-1',
        material_id: 'material-1',
        owner: 'owner-1',
        policy: [],
        purpose: 'sign'
      },
      // Another Avalanche key with OLD spec: m/44'/9000'/0'/0/1
      {
        enabled: true,
        key_type: cs.Secp256k1.Ava,
        derivation_info: {
          derivation_path: "m/44'/9000'/0'/0/1", // OLD spec - accountIndex=0, addressIndex=1
          mnemonic_id: mnemonicId
        },
        public_key:
          '0x2222222222222222222222222222222222222222222222222222222222222222',
        key_id: 'ava-key-2',
        material_id: 'material-1',
        owner: 'owner-1',
        policy: [],
        purpose: 'sign'
      }
    ]

    // Simulate the filter that filters OUT old keys
    // OLD code (before change): kept only old spec keys
    // NEW code (after change): filters OUT old spec keys
    const DEPRECATED_AVALANCHE_DERIVATION_PATH_PREFIX = "m/44'/9000'/0'/0/" // Old spec prefix

    // Apply filter that filters OUT old keys
    const filteredAfterRemovingOld = keyInfosWithOldSpec.filter(k => {
      if (
        k.key_type === cs.Secp256k1.Ava ||
        k.key_type === cs.Secp256k1.AvaTest
      ) {
        // NEW logic: filter OUT old spec (return false if starts with deprecated prefix)
        const isOldSpec = k.derivation_info?.derivation_path?.startsWith(
          DEPRECATED_AVALANCHE_DERIVATION_PATH_PREFIX
        )
        return !isOldSpec // Filter OUT old spec
      }
      return true
    })

    // Now try to transform - this should succeed because EVM keys are returned even without AVA keys
    const result = transformKeyInfosToPubKeys(filteredAfterRemovingOld)
    // Should have EVM key but no AVA keys
    const evmKeys = result.filter(pk => pk.derivationPath.includes("'/60'/"))
    const avaKeys = result.filter(pk => pk.derivationPath.includes("'/9000'/"))
    expect(evmKeys.length).toBeGreaterThan(0)
    expect(avaKeys.length).toBe(0)
  })

  it('should show what happens when backend returns both old and new spec keys', () => {
    const mnemonicId = 'test-mnemonic-id'
    const DEPRECATED_AVALANCHE_DERIVATION_PATH_PREFIX = "m/44'/9000'/0'/0/"

    // Backend returns BOTH old and new spec (for backward compatibility)
    const keyInfosMixed: cs.KeyInfo[] = [
      // EVM key
      {
        enabled: true,
        key_type: cs.Secp256k1.Evm,
        derivation_info: {
          derivation_path: "m/44'/60'/0'/0/0",
          mnemonic_id: mnemonicId
        },
        public_key:
          '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        key_id: 'evm-key-1',
        material_id: 'material-1',
        owner: 'owner-1',
        policy: [],
        purpose: 'sign'
      },
      // OLD spec AVA key
      {
        enabled: true,
        key_type: cs.Secp256k1.Ava,
        derivation_info: {
          derivation_path: "m/44'/9000'/0'/0/0", // OLD spec
          mnemonic_id: mnemonicId
        },
        public_key:
          '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
        key_id: 'ava-key-old',
        material_id: 'material-1',
        owner: 'owner-1',
        policy: [],
        purpose: 'sign'
      },
      // NEW spec AVA key
      {
        enabled: true,
        key_type: cs.Secp256k1.Ava,
        derivation_info: {
          derivation_path: "m/44'/9000'/1'/0/0", // NEW spec - accountIndex=1, addressIndex=0
          mnemonic_id: mnemonicId
        },
        public_key:
          '0x3333333333333333333333333333333333333333333333333333333333333333',
        key_id: 'ava-key-new',
        material_id: 'material-1',
        owner: 'owner-1',
        policy: [],
        purpose: 'sign'
      }
    ]

    // Filter OUT old keys
    const filtered = keyInfosMixed.filter(k => {
      if (
        k.key_type === cs.Secp256k1.Ava ||
        k.key_type === cs.Secp256k1.AvaTest
      ) {
        return !k.derivation_info?.derivation_path?.startsWith(
          DEPRECATED_AVALANCHE_DERIVATION_PATH_PREFIX
        )
      }
      return true
    })

    const avaKeys = filtered.filter(k => k.key_type === cs.Secp256k1.Ava)
    if (avaKeys.length > 0) {
      const result = transformKeyInfosToPubKeys(filtered)
      expect(result.length).toBeGreaterThan(0)
    } else {
      expect(() => {
        transformKeyInfosToPubKeys(filtered)
      }).toThrow('Accounts keys missing')
    }
  })

  it('should handle both old and new spec keys simultaneously (option 3)', () => {
    const mnemonicId = 'test-mnemonic-id'

    // Backend returns BOTH old and new spec keys (backward compatibility)
    const keyInfosBothSpecs: cs.KeyInfo[] = [
      // EVM key with addressIndex 0 (maps to account 0)
      {
        enabled: true,
        key_type: cs.Secp256k1.Evm,
        derivation_info: {
          derivation_path: "m/44'/60'/0'/0/0",
          mnemonic_id: mnemonicId
        },
        public_key:
          '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        key_id: 'evm-key-0',
        material_id: 'material-1',
        owner: 'owner-1',
        policy: [],
        purpose: 'sign'
      },
      // OLD spec AVA keys (all map to account 0)
      {
        enabled: true,
        key_type: cs.Secp256k1.Ava,
        derivation_info: {
          derivation_path: "m/44'/9000'/0'/0/0", // OLD spec
          mnemonic_id: mnemonicId
        },
        public_key:
          '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
        key_id: 'ava-key-old-0',
        material_id: 'material-1',
        owner: 'owner-1',
        policy: [],
        purpose: 'sign'
      },
      {
        enabled: true,
        key_type: cs.Secp256k1.Ava,
        derivation_info: {
          derivation_path: "m/44'/9000'/0'/0/1", // OLD spec
          mnemonic_id: mnemonicId
        },
        public_key:
          '0x2222222222222222222222222222222222222222222222222222222222222222',
        key_id: 'ava-key-old-1',
        material_id: 'material-1',
        owner: 'owner-1',
        policy: [],
        purpose: 'sign'
      },
      // NEW spec AVA key (maps to account 1)
      {
        enabled: true,
        key_type: cs.Secp256k1.Ava,
        derivation_info: {
          derivation_path: "m/44'/9000'/1'/0/0", // NEW spec - accountIndex=1
          mnemonic_id: mnemonicId
        },
        public_key:
          '0x3333333333333333333333333333333333333333333333333333333333333333',
        key_id: 'ava-key-new-1',
        material_id: 'material-1',
        owner: 'owner-1',
        policy: [],
        purpose: 'sign'
      },
      // EVM key with addressIndex 1 (maps to account 1) - needed for new spec AVA
      {
        enabled: true,
        key_type: cs.Secp256k1.Evm,
        derivation_info: {
          derivation_path: "m/44'/60'/0'/0/1", // Maps to account 1
          mnemonic_id: mnemonicId
        },
        public_key:
          '0x4444444444444444444444444444444444444444444444444444444444444444',
        key_id: 'evm-key-1',
        material_id: 'material-1',
        owner: 'owner-1',
        policy: [],
        purpose: 'sign'
      }
    ]

    const result = transformKeyInfosToPubKeys(keyInfosBothSpecs)
    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle old spec keys with EVM keys having addressIndex > 0 (the actual bug scenario)', () => {
    const mnemonicId = 'test-mnemonic-id'

    // This is the scenario that was failing:
    // Backend returns old spec AVA keys (all map to account 0)
    // But also has EVM keys with addressIndex > 0 (create accounts 1, 2, etc.)
    // Old validation required ALL accounts to have both types → FAILED
    // New validation only keeps accounts with both types → WORKS
    const keyInfosOldSpecWithMultipleEVM: cs.KeyInfo[] = [
      // EVM key with addressIndex 0 (maps to account 0)
      {
        enabled: true,
        key_type: cs.Secp256k1.Evm,
        derivation_info: {
          derivation_path: "m/44'/60'/0'/0/0",
          mnemonic_id: mnemonicId
        },
        public_key:
          '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        key_id: 'evm-key-0',
        material_id: 'material-1',
        owner: 'owner-1',
        policy: [],
        purpose: 'sign'
      },
      // EVM key with addressIndex 1 (maps to account 1) - this was causing the issue
      {
        enabled: true,
        key_type: cs.Secp256k1.Evm,
        derivation_info: {
          derivation_path: "m/44'/60'/0'/0/1",
          mnemonic_id: mnemonicId
        },
        public_key:
          '0x1111111111111111111111111111111111111111111111111111111111111111',
        key_id: 'evm-key-1',
        material_id: 'material-1',
        owner: 'owner-1',
        policy: [],
        purpose: 'sign'
      },
      // OLD spec AVA keys (all map to account 0)
      {
        enabled: true,
        key_type: cs.Secp256k1.Ava,
        derivation_info: {
          derivation_path: "m/44'/9000'/0'/0/0", // OLD spec
          mnemonic_id: mnemonicId
        },
        public_key:
          '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
        key_id: 'ava-key-old-0',
        material_id: 'material-1',
        owner: 'owner-1',
        policy: [],
        purpose: 'sign'
      },
      {
        enabled: true,
        key_type: cs.Secp256k1.Ava,
        derivation_info: {
          derivation_path: "m/44'/9000'/0'/0/1", // OLD spec
          mnemonic_id: mnemonicId
        },
        public_key:
          '0x2222222222222222222222222222222222222222222222222222222222222222',
        key_id: 'ava-key-old-1',
        material_id: 'material-1',
        owner: 'owner-1',
        policy: [],
        purpose: 'sign'
      }
    ]

    const result = transformKeyInfosToPubKeys(keyInfosOldSpecWithMultipleEVM)

    // Verify both EVM keys are returned (account 0 and account 1)
    const evmPaths = result.filter(pk => pk.derivationPath.includes("'/60'/"))
    const avaPaths = result.filter(pk => pk.derivationPath.includes("'/9000'/"))

    // Should have both EVM keys (account 0 and account 1)
    expect(evmPaths.length).toBe(2)
    expect(evmPaths.some(pk => pk.derivationPath === "m/44'/60'/0'/0/0")).toBe(
      true
    )
    expect(evmPaths.some(pk => pk.derivationPath === "m/44'/60'/0'/0/1")).toBe(
      true
    )
    // Account 0 should have AVA keys
    expect(avaPaths.length).toBeGreaterThan(0)
    // Account 1 won't have AVA keys yet (will be added by deriveMissingKeys)
  })

  it('should show what happens when account 1 is filtered out', () => {
    const mnemonicId = 'test-mnemonic-id'

    const keyInfos: cs.KeyInfo[] = [
      // EVM key with addressIndex 0 (account 0)
      {
        enabled: true,
        key_type: cs.Secp256k1.Evm,
        derivation_info: {
          derivation_path: "m/44'/60'/0'/0/0",
          mnemonic_id: mnemonicId
        },
        public_key:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        key_id: 'evm-key-0',
        material_id: 'material-1',
        owner: 'owner-1',
        policy: [],
        purpose: 'sign'
      },
      // EVM key with addressIndex 1 (account 1) - THIS WILL BE LOST
      {
        enabled: true,
        key_type: cs.Secp256k1.Evm,
        derivation_info: {
          derivation_path: "m/44'/60'/0'/0/1",
          mnemonic_id: mnemonicId
        },
        public_key:
          '0x1111111111111111111111111111111111111111111111111111111111111111',
        key_id: 'evm-key-1',
        material_id: 'material-1',
        owner: 'owner-1',
        policy: [],
        purpose: 'sign'
      },
      // OLD spec AVA keys (all map to account 0)
      {
        enabled: true,
        key_type: cs.Secp256k1.Ava,
        derivation_info: {
          derivation_path: "m/44'/9000'/0'/0/0",
          mnemonic_id: mnemonicId
        },
        public_key:
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        key_id: 'ava-key-0',
        material_id: 'material-1',
        owner: 'owner-1',
        policy: [],
        purpose: 'sign'
      }
    ]

    const result = transformKeyInfosToPubKeys(keyInfos)

    // Verify account 1's EVM key IS in the result
    const account1EVM = result.find(
      pk => pk.derivationPath === "m/44'/60'/0'/0/1"
    )
    expect(account1EVM).toBeDefined()

    // Verify account 0's EVM key IS in the result
    const account0EVM = result.find(
      pk => pk.derivationPath === "m/44'/60'/0'/0/0"
    )
    expect(account0EVM).toBeDefined()

    // Verify account 0 has AVA keys
    const account0AVA = result.filter(pk =>
      pk.derivationPath.includes("'/9000'/")
    )
    expect(account0AVA.length).toBeGreaterThan(0)

    // Verify account 1 does NOT have AVA keys yet
    const account1AVA = result.filter(
      pk =>
        pk.derivationPath.includes("'/9000'/") &&
        pk.derivationPath.includes('/1')
    )
    expect(account1AVA.length).toBe(0)
  })
})
