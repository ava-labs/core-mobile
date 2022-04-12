import {NativeModules} from 'react-native'

const Aes = NativeModules.Aes

export interface EncryptedData {
  cipher: string
  iv: string
}

export async function getEncryptionKey(pin: string) {
  return Aes.pbkdf2(pin, 'SALT', 4096, 256)
}

export async function encrypt(data: string, key: string): Promise<string> {
  const iv = await Aes.randomKey(16)
  const cipher = await Aes.encrypt(data, key, iv)
  return JSON.stringify({
    cipher,
    iv
  })
}

export async function decrypt(
  encryptedData: EncryptedData,
  key: string
): Promise<string> {
  return Aes.decrypt(encryptedData.cipher, key, encryptedData.iv)
}
