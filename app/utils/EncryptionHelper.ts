import { NativeModules } from 'react-native'
import argon2 from 'react-native-argon2'

const Aes = NativeModules.Aes

export interface EncryptedData {
  cipher: string
  iv: string
  salt: string
}

async function getDerivedKey(password: string, salt: string): Promise<string> {
  const { rawHash } = await argon2(password, salt, {
    iterations: 2,
    memory: 32 * 1024, // 32 MB
    parallelism: 6,
    hashLength: 32, // 256-bit output
    mode: 'argon2id'
  })
  return rawHash
}

export async function encrypt(data: string, password: string): Promise<string> {
  const salt = await Aes.randomKey(16) // 128-bit salt
  const iv = await Aes.randomKey(16) // 128-bit iv
  const key = await getDerivedKey(password, salt)
  const cipher = await Aes.encrypt(data, key, iv)

  return JSON.stringify({
    cipher,
    iv,
    salt
  })
}

export async function decrypt(
  encryptedData: string,
  password: string
): Promise<string> {
  const { cipher, iv, salt } = JSON.parse(encryptedData) as EncryptedData
  const key = await getDerivedKey(password, salt)
  return Aes.decrypt(cipher, key, iv)
}
