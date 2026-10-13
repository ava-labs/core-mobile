import { Utxo } from '@avalabs/avalanchejs'
import {
  SMALL_UTXO_THRESHOLD_NAVAX,
  filterOutSmallUtxos
} from './filterSmallUtxos'

const AVAX_ASSET_ID = 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z'
const OTHER_ASSET_ID = '2fombhL7aGPwj3KH4bfrmJwW6PVnMobf9Y2fn9GwxiAAJyFDbe'

const mockUtxo = (assetId: string, amount: bigint): Utxo =>
  ({
    getAssetId: () => assetId,
    output: { amount: () => amount }
  } as unknown as Utxo)

describe('filterOutSmallUtxos', () => {
  it('exports the shared 0.002 AVAX threshold', () => {
    expect(SMALL_UTXO_THRESHOLD_NAVAX).toBe(2_000_000n)
  })

  it('drops AVAX UTXOs below the threshold', () => {
    const dust = mockUtxo(AVAX_ASSET_ID, 1_999_999n)
    const keep = mockUtxo(AVAX_ASSET_ID, 2_000_001n)
    expect(filterOutSmallUtxos([dust, keep], AVAX_ASSET_ID)).toEqual([keep])
  })

  it('keeps an AVAX UTXO of exactly the threshold (inclusive)', () => {
    const boundary = mockUtxo(AVAX_ASSET_ID, 2_000_000n)
    expect(filterOutSmallUtxos([boundary], AVAX_ASSET_ID)).toEqual([boundary])
  })

  it('never drops non-AVAX UTXOs, however small', () => {
    const tinyOther = mockUtxo(OTHER_ASSET_ID, 1n)
    expect(filterOutSmallUtxos([tinyOther], AVAX_ASSET_ID)).toEqual([tinyOther])
  })

  it('keeps UTXOs whose output has no amount() (non-transfer outputs)', () => {
    const noAmount = {
      getAssetId: () => AVAX_ASSET_ID,
      output: {}
    } as unknown as Utxo
    expect(filterOutSmallUtxos([noAmount], AVAX_ASSET_ID)).toEqual([noAmount])
  })
})
