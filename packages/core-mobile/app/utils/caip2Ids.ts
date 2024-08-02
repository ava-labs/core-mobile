import { ChainId } from '@avalabs/core-chains-sdk'

enum CaipNamespace {
  AVAX = 'avax',
  BIP122 = 'bip122',
  EIP155 = 'eip155'
}

export const BitcoinCaipId = {
  [ChainId.BITCOIN]: `${CaipNamespace.BIP122}:000000000019d6689c085ae165831e93`,
  [ChainId.BITCOIN_TESTNET]: `${CaipNamespace.BIP122}:000000000933ea01ad0ee984209779ba`
}
