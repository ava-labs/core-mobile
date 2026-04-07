/**
 * Validation test: Can we derive Avalanche bech32 addresses offline from xpubs?
 *
 * This test generates xpubs from a known mnemonic (simulating what a Ledger device
 * would return via getExtendedPublicKeys), then verifies that:
 * 1. EVM addresses derived offline match the standard derivation
 * 2. Avalanche X/P/CoreEth bech32 addresses can be derived from the public key
 *    using publicKeyBytesToAddress + formatBech32
 * 3. Bitcoin addresses derived offline match the standard derivation
 * 4. Testnet addresses use the correct HRP (fuji vs avax)
 *
 * If these tests pass, we can safely skip getAllAddresses() device calls for
 * accounts 1-9 and derive everything offline from xpubs.
 */
import { bip32 } from 'utils/bip32'
import {
  getEvmAddressFromPubKey,
  getBtcAddressFromPubKey
} from '@avalabs/core-wallets-sdk'
import { secp256k1, utils, networkIDs } from '@avalabs/avalanchejs'
import { networks } from 'bitcoinjs-lib'
import { mnemonicToSeedSync } from 'bip39'

// Standard BIP39 test mnemonic (DO NOT use in production)
const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

/**
 * Simulates what a Ledger device returns for getExtendedPublicKeys(accountIndex).
 * Derives the xpub at the account level using the mnemonic.
 */
function deriveXpubFromMnemonic(
  mnemonic: string,
  accountIndex: number,
  coinType: number
): string {
  const seed = mnemonicToSeedSync(mnemonic)
  const root = bip32.fromSeed(seed)
  // Account-level path: m/44'/coinType'/accountIndex'
  const accountNode = root.derivePath(`m/44'/${coinType}'/${accountIndex}'`)
  return accountNode.neutered().toBase58()
}

/**
 * Simulates what getAllAddresses() returns from the device:
 * derives the full address at m/44'/coinType'/accountIndex'/0/0
 */
function deriveAddressFromMnemonic(
  mnemonic: string,
  accountIndex: number,
  coinType: number
): Buffer {
  const seed = mnemonicToSeedSync(mnemonic)
  const root = bip32.fromSeed(seed)
  const node = root.derivePath(`m/44'/${coinType}'/${accountIndex}'/0/0`)
  return node.publicKey
}

describe('Offline address derivation validation', () => {
  // Generate xpubs (simulating Ledger getExtendedPublicKeys)
  const evmXpub = deriveXpubFromMnemonic(TEST_MNEMONIC, 0, 60)
  const avalancheXpub = deriveXpubFromMnemonic(TEST_MNEMONIC, 0, 9000)

  // Generate "device-derived" public keys (simulating getAllAddresses)
  const deviceEvmPubKey = deriveAddressFromMnemonic(TEST_MNEMONIC, 0, 60)
  const deviceAvalanchePubKey = deriveAddressFromMnemonic(
    TEST_MNEMONIC,
    0,
    9000
  )

  describe('public key derivation from xpub matches device derivation', () => {
    it('EVM public key from xpub matches device-derived key', () => {
      const hdNode = bip32.fromBase58(evmXpub)
      const offlinePubKey = hdNode.derive(0).derive(0).publicKey

      expect(offlinePubKey.toString('hex')).toBe(
        deviceEvmPubKey.toString('hex')
      )
    })

    it('Avalanche public key from xpub matches device-derived key', () => {
      const hdNode = bip32.fromBase58(avalancheXpub)
      const offlinePubKey = hdNode.derive(0).derive(0).publicKey

      expect(offlinePubKey.toString('hex')).toBe(
        deviceAvalanchePubKey.toString('hex')
      )
    })
  })

  describe('EVM address derivation', () => {
    it('derives correct EVM address from xpub offline', () => {
      const hdNode = bip32.fromBase58(evmXpub)
      const pubKey = hdNode.derive(0).derive(0).publicKey
      const offlineAddress = getEvmAddressFromPubKey(pubKey)

      // Also derive from the "device" public key
      const deviceAddress = getEvmAddressFromPubKey(deviceEvmPubKey)

      expect(offlineAddress).toBe(deviceAddress)
      expect(offlineAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })
  })

  describe('Bitcoin address derivation', () => {
    it('derives correct mainnet BTC address from EVM xpub offline', () => {
      const hdNode = bip32.fromBase58(evmXpub)
      const pubKey = hdNode.derive(0).derive(0).publicKey

      const offlineAddress = getBtcAddressFromPubKey(pubKey, networks.bitcoin)
      const deviceAddress = getBtcAddressFromPubKey(
        deviceEvmPubKey,
        networks.bitcoin
      )

      expect(offlineAddress).toBe(deviceAddress)
    })

    it('derives correct testnet BTC address from EVM xpub offline', () => {
      const hdNode = bip32.fromBase58(evmXpub)
      const pubKey = hdNode.derive(0).derive(0).publicKey

      const offlineAddress = getBtcAddressFromPubKey(pubKey, networks.testnet)
      const deviceAddress = getBtcAddressFromPubKey(
        deviceEvmPubKey,
        networks.testnet
      )

      expect(offlineAddress).toBe(deviceAddress)
    })
  })

  describe('Avalanche bech32 address derivation', () => {
    it('derives Avalanche X/P addresses from xpub using publicKeyBytesToAddress', () => {
      const hdNode = bip32.fromBase58(avalancheXpub)
      const pubKey = hdNode.derive(0).derive(0).publicKey

      const addressBytes = secp256k1.publicKeyBytesToAddress(
        Uint8Array.from(pubKey)
      )
      const bech32Addr = utils.formatBech32(networkIDs.MainnetHRP, addressBytes)

      const xAddr = `X-${bech32Addr}`
      const pAddr = `P-${bech32Addr}`

      // Addresses should have correct format
      expect(xAddr).toMatch(/^X-avax1[a-z0-9]+$/)
      expect(pAddr).toMatch(/^P-avax1[a-z0-9]+$/)

      // X and P share the same bech32 body
      expect(xAddr.slice(2)).toBe(pAddr.slice(2))
    })

    it('derives CoreEth bech32 address from EVM xpub', () => {
      const hdNode = bip32.fromBase58(evmXpub)
      const pubKey = hdNode.derive(0).derive(0).publicKey

      const addressBytes = secp256k1.publicKeyBytesToAddress(
        Uint8Array.from(pubKey)
      )
      const bech32Addr = utils.formatBech32(networkIDs.MainnetHRP, addressBytes)

      const coreEthAddr = `C-${bech32Addr}`
      expect(coreEthAddr).toMatch(/^C-avax1[a-z0-9]+$/)
    })

    it('derives testnet addresses with fuji HRP', () => {
      const hdNode = bip32.fromBase58(avalancheXpub)
      const pubKey = hdNode.derive(0).derive(0).publicKey

      const mainnetBytes = secp256k1.publicKeyBytesToAddress(
        Uint8Array.from(pubKey)
      )
      const testnetBytes = secp256k1.publicKeyBytesToAddress(
        Uint8Array.from(pubKey)
      )

      const mainnetAddr = utils.formatBech32(
        networkIDs.MainnetHRP,
        mainnetBytes
      )
      const testnetAddr = utils.formatBech32(networkIDs.FujiHRP, testnetBytes)

      expect(mainnetAddr).toContain('avax1')
      expect(testnetAddr).toContain('fuji1')

      // Same address bytes — re-parsing both should yield identical payloads
      const [, mainnetPayload] = utils.parseBech32(mainnetAddr)
      const [, testnetPayload] = utils.parseBech32(testnetAddr)
      expect(Buffer.from(mainnetPayload).toString('hex')).toBe(
        Buffer.from(testnetPayload).toString('hex')
      )
    })

    it('works for multiple account indices', () => {
      // Verify accounts 0, 1, 2 all produce valid but different addresses
      const addresses: string[] = []

      for (let i = 0; i < 3; i++) {
        const xpub = deriveXpubFromMnemonic(TEST_MNEMONIC, i, 9000)
        const hdNode = bip32.fromBase58(xpub)
        const pubKey = hdNode.derive(0).derive(0).publicKey

        const addrBytes = secp256k1.publicKeyBytesToAddress(
          Uint8Array.from(pubKey)
        )
        const addr = utils.formatBech32(networkIDs.MainnetHRP, addrBytes)
        addresses.push(addr)
      }

      // All should be valid
      addresses.forEach(addr => {
        expect(addr).toMatch(/^avax1[a-z0-9]+$/)
      })

      // All should be different (different account xpubs = different addresses)
      const unique = new Set(addresses)
      expect(unique.size).toBe(3)
    })
  })
})
