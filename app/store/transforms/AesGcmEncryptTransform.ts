import * as Crypto from 'crypto'
import { createTransform } from 'redux-persist'
import { encryptTransform } from 'redux-persist-transform-encrypt'
import { RawRootState } from 'store'
import Logger from 'utils/Logger'
import {
  deserializeReduxState,
  serializeReduxState
} from 'store/utils/seralization'

export type AesGcmStoreType = {
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
    (outboundState: AesGcmStoreType, key, rawState) => {
      //We need to check if this is the state encrypted with  AES-CBC algorithm
      const maybeAesCbcEncrypted = outboundState as unknown
      if (typeof maybeAesCbcEncrypted === 'string') {
        Logger.info(
          'Rehydrated state is encrypted with old algorithm, decrypt it with redux-persist-transform-encrypt'
        )
        const encryptionTransform = encryptTransform<
          RawRootState,
          RawRootState,
          RawRootState
        >({
          secretKey
        })
        return encryptionTransform.out(maybeAesCbcEncrypted, key, rawState)
      }

      //Make sure we have right object here
      if (!('ciphertext' in outboundState)) {
        Logger.error('Unknown state, expecting AesGcmStoreType')
        throw new Error('Unknown state, expecting AesGcmStoreType')
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
