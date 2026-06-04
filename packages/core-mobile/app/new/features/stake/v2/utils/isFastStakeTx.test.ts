import { PChainTransaction } from '@avalabs/glacier-sdk'
import {
  FAST_STAKE_FEE_ESCROW_ADDRESS_FUJI,
  FAST_STAKE_FEE_ESCROW_ADDRESS_MAINNET
} from '../constants'
import { isFastStakeTx } from './isFastStakeTx'

/**
 * Builds a minimal PChainTransaction fixture with only the fields
 * `isFastStakeTx` reads. Glacier's `PChainUtxo` has dozens of unrelated
 * fields, so we cast through `unknown` rather than fabricating defaults
 * that the implementation never inspects.
 */
const makeTx = (utxoAddresses: string[][]): PChainTransaction =>
  ({
    emittedUtxos: utxoAddresses.map(addresses => ({ addresses }))
  } as unknown as PChainTransaction)

describe('isFastStakeTx', () => {
  describe('mainnet', () => {
    it('returns true when an emitted UTXO contains the mainnet escrow address with P- prefix', () => {
      const tx = makeTx([[FAST_STAKE_FEE_ESCROW_ADDRESS_MAINNET]])
      expect(isFastStakeTx(tx, false)).toBe(true)
    })

    it('returns true when an emitted UTXO contains the mainnet escrow address without P- prefix', () => {
      // Glacier returns UTXO `addresses` stripped of the chain prefix, so the
      // implementation must compare against the stripped form too. This case
      // is the one that actually occurs in production.
      const addrNoPrefix = FAST_STAKE_FEE_ESCROW_ADDRESS_MAINNET.replace(
        /^P-/,
        ''
      )
      const tx = makeTx([[addrNoPrefix]])
      expect(isFastStakeTx(tx, false)).toBe(true)
    })

    it('returns true when escrow address appears among other addresses on the same UTXO', () => {
      const tx = makeTx([
        ['avax1other', FAST_STAKE_FEE_ESCROW_ADDRESS_MAINNET, 'avax1another']
      ])
      expect(isFastStakeTx(tx, false)).toBe(true)
    })

    it('returns true when escrow address is in a later UTXO, not the first', () => {
      const tx = makeTx([
        ['avax1other'],
        [FAST_STAKE_FEE_ESCROW_ADDRESS_MAINNET]
      ])
      expect(isFastStakeTx(tx, false)).toBe(true)
    })

    it('returns false when no UTXO addresses match the mainnet escrow', () => {
      const tx = makeTx([['avax1someaddress', 'avax1anotheraddress']])
      expect(isFastStakeTx(tx, false)).toBe(false)
    })

    it('returns false when the fuji escrow address is present on mainnet', () => {
      // Network is determined by the caller's `isTestnet` arg; we should not
      // accept the fuji address on a mainnet tx (and vice versa).
      const tx = makeTx([[FAST_STAKE_FEE_ESCROW_ADDRESS_FUJI]])
      expect(isFastStakeTx(tx, false)).toBe(false)
    })
  })

  describe('testnet (fuji)', () => {
    it('returns true when an emitted UTXO contains the fuji escrow address with P- prefix', () => {
      const tx = makeTx([[FAST_STAKE_FEE_ESCROW_ADDRESS_FUJI]])
      expect(isFastStakeTx(tx, true)).toBe(true)
    })

    it('returns true when an emitted UTXO contains the fuji escrow address without P- prefix', () => {
      const addrNoPrefix = FAST_STAKE_FEE_ESCROW_ADDRESS_FUJI.replace(/^P-/, '')
      const tx = makeTx([[addrNoPrefix]])
      expect(isFastStakeTx(tx, true)).toBe(true)
    })

    it('returns false when no UTXO addresses match the fuji escrow', () => {
      const tx = makeTx([['fuji1someaddress']])
      expect(isFastStakeTx(tx, true)).toBe(false)
    })

    it('returns false when the mainnet escrow address is present on testnet', () => {
      const tx = makeTx([[FAST_STAKE_FEE_ESCROW_ADDRESS_MAINNET]])
      expect(isFastStakeTx(tx, true)).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('returns false when emittedUtxos is empty', () => {
      const tx = makeTx([])
      expect(isFastStakeTx(tx, false)).toBe(false)
      expect(isFastStakeTx(tx, true)).toBe(false)
    })

    it('returns false when all UTXOs have empty addresses arrays', () => {
      const tx = makeTx([[], []])
      expect(isFastStakeTx(tx, false)).toBe(false)
    })
  })
})
