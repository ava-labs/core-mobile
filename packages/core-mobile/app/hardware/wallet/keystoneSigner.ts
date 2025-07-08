import { UR } from '@ngraveio/bc-ur'
import { requestKeystoneSigner } from 'features/hardware/utils'

export const signer = async (
  request: UR,
  responseURTypes: string[],
  handleResult: (cbor: Buffer) => Promise<string>
): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    if (process.env.JEST_WORKER_ID !== undefined) {
      return resolve('0xmockedsignature')
    }
    requestKeystoneSigner({
      request,
      responseURTypes,
      onReject: (message?: string) => {
        reject(message ?? 'User rejected')
      },
      onApprove: (cbor: Buffer) => {
        return handleResult(cbor).then(resolve).catch(reject)
      }
    })
  })
}
