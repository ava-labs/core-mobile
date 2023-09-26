import * as Crypto from 'crypto'
import { createTransform } from 'redux-persist'
import { RawRootState } from 'store'
import Logger from 'utils/Logger'

type AesGcmStoreType = {
  iv: Uint8Array
  ciphertext: string
}
const ALGORITHM = 'aes-256-gcm'
const ENCRYPT_OUTPUT_ENCODING = 'base64'
const DECRYPT_INPUT_ENCODING = 'base64'

export const AesGcmEncryptTransform = (secretKey: string) =>
  createTransform<RawRootState, AesGcmStoreType, RawRootState, RawRootState>(
    // transform state before it gets serialized and persisted
    (inboundState: RawRootState) => {
      // The iv must never be reused with a given key.
      const iv = Crypto.randomBytes(16)
      const key = Crypto.createHash('sha256').update(secretKey, 'utf8').digest()

      const cipher = Crypto.createCipheriv(ALGORITHM, key, iv)

      let ciphertext = cipher.update(
        JSON.stringify(inboundState),
        'utf8',
        ENCRYPT_OUTPUT_ENCODING
      )
      ciphertext += cipher.final(ENCRYPT_OUTPUT_ENCODING)
      return {
        iv: iv.valueOf(),
        ciphertext
      } as AesGcmStoreType
    },
    // transform state after it gets rehydrated
    (outboundState: AesGcmStoreType) => {
      if (!('ciphertext' in outboundState)) {
        Logger.trace(
          '------> This is unencrypted db, will encrypt on next store'
        )
        return outboundState as unknown as RawRootState
      }

      const key = Crypto.createHash('sha256').update(secretKey, 'utf8').digest()

      const iv = Buffer.from(outboundState.iv)
      const decipher = Crypto.createDecipheriv(ALGORITHM, key, iv)

      let cleartext = decipher.update(
        outboundState.ciphertext,
        DECRYPT_INPUT_ENCODING,
        'utf8'
      )
      cleartext += decipher.final('utf8')

      return JSON.parse(cleartext)
    },
    {}
  )
