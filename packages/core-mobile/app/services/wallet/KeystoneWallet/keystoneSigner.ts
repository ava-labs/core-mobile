import { UR } from '@ngraveio/bc-ur'
import { requestKeystoneSigner } from 'features/keystone/utils'

export const signer = async (
  request: UR,
  responseURTypes: string[],
  handleResult: (cbor: Buffer) => Promise<string>
): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
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
