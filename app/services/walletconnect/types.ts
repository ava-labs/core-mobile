import { IClientMeta } from '@walletconnect/legacy-types'
import { CLIENT_METADATA } from 'services/walletconnectv2/types'

export const CLIENT_OPTIONS = {
  clientMeta: {
    name: CLIENT_METADATA.name,
    description: CLIENT_METADATA.description,
    url: CLIENT_METADATA.url,
    icons: CLIENT_METADATA.icons,
    walletId: CLIENT_METADATA.walletId, // core web depends on this id to distinguish core mobile from other wallets
    ssl: true
  }
}

export type PeerMeta = IClientMeta | null
