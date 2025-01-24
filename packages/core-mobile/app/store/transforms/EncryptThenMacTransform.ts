import Crypto from 'react-native-quick-crypto'
import { createTransform } from 'redux-persist'
import { encryptTransform } from 'redux-persist-transform-encrypt'
import { RawRootState } from 'store'
import Logger from 'utils/Logger'
import { Transform } from 'redux-persist/es/types'
import { serializeJson } from 'utils/serialization/serialize'
import { deserializeJson } from 'utils/serialization/deserialize'

export type VersionedStore = EncryptThenMacStoreType & {
  /**
   * Used for versioning if there will be any future changes
   * in format/algorithm of persisted store.
   */
  version: number
}

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
const UTF8 = 'utf8'

/**
 * EncryptThenMacTransform is used to encrypt and decrypt redux store.
 * It uses AES-CBC algorithm to encrypt the payload and attaches/checks MAC of that ciphertext to protect from store manipulation.
 * To migrate existing users to this kind of encryption this function makes sure that previously encrypted store
 * is decrypted with redux-persist-transform-encrypt (previous) library.
 */
export const EncryptThenMacTransform: (
  secretKey: string,
  macKey: string
) => Transform<
  RawRootState | undefined,
  VersionedStore | undefined,
  RawRootState,
  RawRootState
> = (secretKey: string, macKey: string) =>
  createTransform<
    RawRootState | undefined,
    VersionedStore | undefined,
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

      const buffer = cipher.update(
        serializeJson(inboundState),
        // @ts-ignore
        UTF8,
        ENCRYPT_OUTPUT_ENCODING
      )
      // @ts-ignore
      const ciphertext = buffer + cipher.final(ENCRYPT_OUTPUT_ENCODING)
      const mac = getMac(macKey, ciphertext)

      return {
        iv: iv.valueOf(),
        ciphertext,
        mac,
        version: 1
      } as VersionedStore
    },

    // transform state after it gets rehydrated
    (outboundState: VersionedStore | undefined, key, rawState) => {
      //We need to check if this is the state encrypted with old transform function
      const maybeOldEncryption = outboundState as unknown
      if (typeof maybeOldEncryption === 'string') {
        Logger.info(
          'Rehydrated state is encrypted with old transform function, decrypt it with redux-persist-transform-encrypt'
        )
        const encryptionTransform = encryptTransform<
          RawRootState,
          RawRootState,
          RawRootState
        >({
          secretKey
        })
        return encryptionTransform.out(maybeOldEncryption, key, rawState)
      }

      if (!outboundState) {
        return undefined
      }
      //Make sure we have the right object here
      if (!('ciphertext' in outboundState)) {
        Logger.error('Unknown state, expecting VersionedStore')
        return undefined
      }

      const iv = Buffer.from(outboundState.iv)
      const computedMac = getMac(macKey, outboundState.ciphertext)
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
        const buffer = decipher.update(
          outboundState.ciphertext,
          // @ts-ignore
          DECRYPT_INPUT_ENCODING,
          UTF8
        )
        const finalBuffer = decipher.final(UTF8)
        const cleartext = buffer.toString() + finalBuffer.toString()
        return deserializeJson(cleartext)
      } catch (e) {
        Logger.error('Failed to decipher', e)
        return undefined
      }
    },
    {}
  )

function getMac(macSecret: string, ciphertext: string): string {
  const hmac = Crypto.createHmac(HASH_ALGORITHM, macSecret)
  hmac.update(ciphertext)
  return hmac.digest(ENCRYPT_OUTPUT_ENCODING)
}
