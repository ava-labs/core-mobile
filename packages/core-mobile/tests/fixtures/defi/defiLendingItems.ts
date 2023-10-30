import { DeFiLendingItem, DeFiProtocolDetailTypes } from 'services/defi/types'

export const DEFI_LENDING_ITEMS: DeFiLendingItem[] = [
  {
    name: 'Lending',
    type: DeFiProtocolDetailTypes.LENDING,
    healthRate: 1.157920892373162e59,
    netUsdValue: 1.0343059276838096,
    supplyTokens: [
      {
        id: 'avax',
        chain: 'avax',
        name: 'Avalanche',
        symbol: 'AVAX',
        decimals: 18,
        logoUrl:
          'https://static.debank.com/image/avax_token/logo_url/avax/0b9c84359c84d6bdd5bfda9c2d4c4a82.png',
        protocolId: '',
        price: 9.29,
        timeAt: 1,
        amount: 0.11000544666972234
      }
    ],
    rewardTokens: [
      {
        id: 'avax',
        chain: 'avax',
        name: 'Avalanche',
        symbol: 'AVAX',
        decimals: 18,
        logoUrl:
          'https://static.debank.com/image/avax_token/logo_url/avax/0b9c84359c84d6bdd5bfda9c2d4c4a82.png',
        protocolId: '',
        price: 9.29,
        timeAt: 1,
        amount: 0.001329959970084932
      }
    ]
  }
]
