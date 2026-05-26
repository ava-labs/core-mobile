import { UR } from '@ngraveio/bc-ur'
import { createCache } from 'utils/createCache'

export type KeystoneSignerParams = {
  request: UR
  responseURTypes: string[]
  // `urType` is forwarded for callers that need to disambiguate between
  // multiple accepted response URTypes (e.g. the on-demand xpub fetch flow
  // accepts crypto-account / crypto-multi-accounts / crypto-hdkey).
  onApprove: (cbor: Buffer, urType: string) => Promise<void>
  onReject: (message?: string) => void
}

export type KeystoneTroubleshootingParams = {
  errorCode: number
  retry: () => void
}

// a simple in-memory cache (no reactivity or persistence support)
export const keystoneParamsCache = {
  keystoneSignerParams: createCache<KeystoneSignerParams>('keystone signer'),
  keystoneTroubleshootingParams: createCache<KeystoneTroubleshootingParams>(
    'keystone troubleshooting'
  )
}
