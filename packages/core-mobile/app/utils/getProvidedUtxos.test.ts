import { PVM } from '@avalabs/avalanchejs'
import { getProvidedUtxos } from './getProvidedUtxos'

describe('getProvidedUtxos', () => {
  const vm = PVM

  it('returns empty array on error', () => {
    const utxos = getProvidedUtxos({ utxoHexes: ['invalidHex'], vm })

    expect(utxos).toEqual([])
  })

  it('returns the correct UTXOs', () => {
    const providedUtxoHexes = [
      '0xe3318b85812bb0895ca1e2e2934d50157eedaf99f6e183e1f6bf42a5596d7ba2000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000700000000139c244000000000000000000000000100000001e2fb840787e8d3e801ec6a6ef159e1e5909b1e64',
      '0xa3453e9e959eab113f560cadf711db8dc1a4ad6ce93b66a6dcaaa0b397493688000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000700000003944275d300000000000000000000000100000001e2fb840787e8d3e801ec6a6ef159e1e5909b1e64',
      '0xd28430f28f30a1701b0569babd6270ca2e97cbadef77792aa22733c30cbc7a0e000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000017c841c000000000000000000000000100000001e2fb840787e8d3e801ec6a6ef159e1e5909b1e64'
    ]

    const utxos = getProvidedUtxos({ utxoHexes: providedUtxoHexes, vm })
    const utxoIds = utxos.map(utxo => utxo.ID())

    expect(utxoIds).toEqual([
      '2pszDsBJUp8EeLykLZdXWtvzQjfvV4b9jkJarTFaan8L7tY2Qy',
      '2EAbpLAzwjUNCffzatiPiJWB1jhnEDAYHmAQXU5T3oG9MpBRGq',
      'GSDyojeAzN6JB2TPDNgT3oDievSoR8kG6ohCSCTrnovcL7VyR'
    ])
  })
})
