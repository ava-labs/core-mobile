import { IClientMeta } from '@walletconnect/types'

const CORE_MOBILE_WALLET_ID = 'c3de833a-9cb0-4274-bb52-86e402ecfcd3'

export const CLIENT_OPTIONS = {
  clientMeta: {
    // Required
    description: 'Core Mobile',
    url: 'https://www.avax.network',
    icons: [
      'https://assets.website-files.com/5fec984ac113c1d4eec8f1ef/62602f568fb4677b559827e5_core.jpg'
    ],
    name: 'Core',
    ssl: true,
    walletId: CORE_MOBILE_WALLET_ID // core web depends on this id to distinguish core mobile from other wallets
  }
}

export type PeerMeta = IClientMeta | null | undefined
