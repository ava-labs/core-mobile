import * as Crypto from 'crypto'
import { createTransform } from 'redux-persist'
import { RawRootState } from 'store'
import Logger from 'utils/Logger'

type AesGcmStoreType = {
  iv: Uint8Array
  ciphertext: string
  authTag: Uint8Array
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

      const cipher = Crypto.createCipheriv(
        ALGORITHM,
        Buffer.from(secretKey, 'hex'),
        iv
      )

      const ciphertext = Buffer.concat([
        cipher.update(
          JSON.stringify(inboundState, (key, value) =>
            typeof value === 'bigint' ? 'bigint' + value.toString() : value
          ),
          'utf8'
        ),
        cipher.final()
      ]).toString(ENCRYPT_OUTPUT_ENCODING)

      return {
        iv: iv.valueOf(),
        ciphertext,
        authTag: cipher.getAuthTag().valueOf()
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

      const iv = Buffer.from(outboundState.iv)
      const decipher = Crypto.createDecipheriv(
        ALGORITHM,
        Buffer.from(secretKey, 'hex'),
        iv
      )
      decipher.setAuthTag(Buffer.from(outboundState.authTag))

      const cleartext = Buffer.concat([
        decipher.update(outboundState.ciphertext, DECRYPT_INPUT_ENCODING),
        decipher.final()
      ]).toString()

      return JSON.parse(cleartext, (key, value) =>
        typeof value === 'string' && value.startsWith('bigint')
          ? BigInt(value.substring('bigint'.length))
          : value
      )
    },
    {}
  )
