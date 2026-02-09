import { UR } from '@ngraveio/bc-ur'
import { createCache } from 'utils/createCache'

export type KeystoneSignerParams = {
  request: UR
  responseURTypes: string[]
  onApprove: (cbor: Buffer) => Promise<void>
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
