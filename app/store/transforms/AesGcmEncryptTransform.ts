import * as Crypto from 'crypto'
import { createTransform } from 'redux-persist'
import { RawRootState } from 'store'
import Logger from 'utils/Logger'
import {
  deserializeReduxState,
  serializeReduxState
} from 'store/utils/seralization'

type AesGcmStoreType = {
  iv: Uint8Array
  ciphertext: string
  authTag: Uint8Array
}
const ALGORITHM = 'aes-256-gcm'
const ENCRYPT_OUTPUT_ENCODING = 'base64'
const DECRYPT_INPUT_ENCODING = 'base64'
const SECRET_KEY_ENCODING = 'hex'

/**
 * AesGcmEncryptTransform is used to encrypt and decrypt redux store.
 * It uses AES-GCM algorithm to do so.
 * Since users of previous versions of our app might already have redux store encrypted with AES-CBC algorithm
 * we this function makes sure that that kind of store is decrypted with redux-persist-transform-encrypt library.
 */
export const AesGcmEncryptTransform = (secretKey: string) =>
  createTransform<RawRootState, AesGcmStoreType, RawRootState, RawRootState>(
    // transform state before it gets serialized and persisted
    (inboundState: RawRootState) => {
      // The iv must never be reused with a given key. It doesn't need to be secret, only random.
      const iv = Crypto.randomBytes(16)

      const cipher = Crypto.createCipheriv(
        ALGORITHM,
        Buffer.from(secretKey, SECRET_KEY_ENCODING),
        iv
      )

      const ciphertext = Buffer.concat([
        cipher.update(serializeReduxState(inboundState), 'utf8'),
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
        Buffer.from(secretKey, SECRET_KEY_ENCODING),
        iv
      )
      decipher.setAuthTag(Buffer.from(outboundState.authTag))

      const cleartext = Buffer.concat([
        decipher.update(outboundState.ciphertext, DECRYPT_INPUT_ENCODING),
        decipher.final()
      ]).toString()

      return deserializeReduxState(cleartext)
    },
    {}
  )
