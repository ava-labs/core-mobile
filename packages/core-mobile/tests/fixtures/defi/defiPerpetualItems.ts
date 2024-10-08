import { DeFiProtocolDetailTypes, DeFiPerpetualItem } from 'services/defi/types'

export const defiPerpetualItem: DeFiPerpetualItem[] = [
  {
    type: DeFiProtocolDetailTypes.PERPETUALS,
    name: 'Perpetuals',
    positionToken: {
      id: '0xac80096d53c5965d9432592d28687c521472b9eb',
      chain: 'avax',
      name: 'AVAX Token',
      symbol: 'AVAX',
      decimals: 18,
      logoUrl:
        'https://static.debank.com/image/coin/logo_url/usdc/e87790bfe0b3f2ea855dc29069b38818.png',
      protocolId: '',
      price: 16.6295011,
      timeAt: 1650892126,
      amount: 808.5862575877276
    },
    marginToken: {
      id: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
      chain: 'avax',
      name: 'Douche Coin',
      symbol: 'ELON',
      decimals: 6,
      logoUrl:
        'https://static.debank.com/image/eth_token/logo_url/0xdac17f958d2ee523a2206206994597c13d831ec7/66eadee7b7bb16b75e02b570ab8d5c01.png',
      protocolId: '',
      price: 1,
      timeAt: 1637802339,
      amount: 3980.501046807327
    },
    profitUsdValue: 53423.35725257874,
    netUsdValue: 28386.547185810392
  },
  {
    type: DeFiProtocolDetailTypes.PERPETUALS,
    name: 'Perpetuals',
    positionToken: {
      id: '0xac80096d53c5965d9432592d28687c521472b9eb',
      chain: 'avax',
      name: 'AVAX mToken',
      symbol: 'muxAVAX',
      decimals: 18,
      logoUrl: 'https://cryptologos.cc/logos/avalanche-avax-logo.png?v=026',
      protocolId: '',
      price: 16.6295011,
      timeAt: 1650892126,
      amount: 808.5862575877276
    },
    marginToken: {
      id: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
      chain: 'avax',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      logoUrl:
        'https://altcoinsbox.com/wp-content/uploads/2023/04/dogelon-mars-logo.png',
      protocolId: '',
      price: 1,
      timeAt: 1637802339,
      amount: 3980.501046807327
    },
    profitUsdValue: -2477.357252578736,
    netUsdValue: 1503.547185810392
  }
]
