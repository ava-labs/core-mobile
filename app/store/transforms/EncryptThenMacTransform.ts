import * as Crypto from 'crypto'
import { createTransform } from 'redux-persist'
import { encryptTransform } from 'redux-persist-transform-encrypt'
import { RawRootState } from 'store'
import Logger from 'utils/Logger'
import {
  deserializeReduxState,
  serializeReduxState
} from 'store/utils/seralization'
import { Transform } from 'redux-persist/es/types'

export type EncryptThenMacStoreType = {
  iv: Uint8Array
  ciphertext: string
  mac: string
}
const ALGORITHM = 'aes-256-cbc'
const HASH_ALGORITHM = 'sha256'
const ENCRYPT_OUTPUT_ENCODING = 'base64'
const DECRYPT_INPUT_ENCODING = ENCRYPT_OUTPUT_ENCODING
const SECRET_KEY_ENCODING = 'hex'

/**
 * AesGcmEncryptTransform is used to encrypt and decrypt redux store.
 * It uses AES-GCM algorithm to do so.
 * Since users of previous versions of our app might already have redux store encrypted with AES-CBC algorithm
 * we this function makes sure that that kind of store is decrypted with redux-persist-transform-encrypt library.
 */
export const EncryptThenMacTransform: (
  secretKey: string
) => Transform<
  RawRootState | undefined,
  EncryptThenMacStoreType | undefined,
  RawRootState,
  RawRootState
> = (secretKey: string) =>
  createTransform<
    RawRootState | undefined,
    EncryptThenMacStoreType | undefined,
    RawRootState,
    RawRootState
  >(
    // transform state before it gets persisted
    (inboundState: RawRootState | undefined) => {
      if (!inboundState) {
        return undefined
      }
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

      const mac = getMac(secretKey, ciphertext)

      return {
        iv: iv.valueOf(),
        ciphertext,
        mac
      } as EncryptThenMacStoreType
    },

    // transform state after it gets rehydrated
    (outboundState: EncryptThenMacStoreType | undefined, key, rawState) => {
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

      if (!outboundState) {
        return undefined
      }
      //Make sure we have right object here
      if (!('ciphertext' in outboundState)) {
        Logger.error('Unknown state, expecting AesGcmStoreType')
        return undefined
      }

      const iv = Buffer.from(outboundState.iv)
      const computedMac = getMac(secretKey, outboundState.ciphertext)
      if (computedMac !== outboundState.mac) {
        Logger.error('MAC verification failed. Data may be tampered with.')
        return undefined
      }

      const decipher = Crypto.createDecipheriv(
        ALGORITHM,
        Buffer.from(secretKey, SECRET_KEY_ENCODING),
        iv
      )
      try {
        const cleartext = Buffer.concat([
          decipher.update(outboundState.ciphertext, DECRYPT_INPUT_ENCODING),
          decipher.final()
        ]).toString()

        return deserializeReduxState(cleartext)
      } catch (e) {
        Logger.error('Failed to decipher', e)
        return undefined
      }
    },
    {}
  )

function getMac(secretKey: string, ciphertext: string): string {
  const hmacSecret = Crypto.createHash(HASH_ALGORITHM)
    .update(secretKey, SECRET_KEY_ENCODING)
    .digest()
  const hmac = Crypto.createHmac(HASH_ALGORITHM, hmacSecret)
  hmac.update(ciphertext)
  return hmac.digest(ENCRYPT_OUTPUT_ENCODING)
}
