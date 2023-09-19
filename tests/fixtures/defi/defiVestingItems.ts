import { DeFiProtocolDetailTypes, DeFiVestingItem } from 'services/defi/types'

export const DEFI_VESTING_ITEMS: DeFiVestingItem[] = [
  {
    netUsdValue: 2317600.7734764894,
    name: 'Prisma mkUSD',
    type: DeFiProtocolDetailTypes.VESTING,
    token: {
      id: '0x4591dbff62656e7859afe5e45f6f47d3669fbb28',
      chain: 'eth',
      name: 'Prisma mkUSD',
      symbol: 'mkUSD',
      displaySymbol: null,
      optimizedSymbol: 'mkUSD',
      decimals: 18,
      logoUrl:
        'https://static.debank.com/image/eth_token/logo_url/0x4591dbff62656e7859afe5e45f6f47d3669fbb28/979611410205615157e23670128f3823.png',
      protocolId: '',
      price: 0.9968838672050813,
      isVerified: true,
      isCore: true,
      isWallet: true,
      timeAt: 1693427663,
      amount: 2317600.7734764894,
      claimableAmount: 100
    },
    dailyUnlockAmount: 10,
    endAt: 1693427663
  }
]
