import { ErrorBase } from 'errors/ErrorBase'
import argon2 from 'react-native-argon2'
import Aes from 'react-native-aes-crypto'

const VERSION = 2

type Mode = 'argon2id' | 'argon2d' | 'argon2i'

type ArgonConfig = {
  iterations: number
  memory: number
  parallelism: number
  hashLength: number
  mode: Mode
}

type DecryptedData = {
  version: number // what version of the encryption algo was used
  data: string
}

const versionConfigMap: Record<number, ArgonConfig> = {
  1: {
    iterations: 2,
    memory: 32 * 1024, // 32 MB
    parallelism: 6,
    hashLength: 32, // 256-bit output
    mode: 'argon2id'
  },
  2: {
    iterations: 3,
    memory: 64 * 1024, // 64 MB
    parallelism: 4,
    hashLength: 32, // 256-bit output
    mode: 'argon2id'
  }
}

interface EncryptedData {
  cipher: string
  iv: string
  salt: string
  version: string
}

export class NoSaltError extends ErrorBase<'NoSaltError'> {}

export class InvalidVersionError extends ErrorBase<'InvalidVersionError'> {}

async function getDerivedKey(
  password: string,
  salt: string,
  version: number
): Promise<string> {
  const config = versionConfigMap[version]

  if (!config)
    throw new InvalidVersionError({
      message: `no config for version ${VERSION}`
    })

  const { rawHash } = await argon2(password, salt, config)

  return rawHash
}

export async function encrypt(data: string, password: string): Promise<string> {
  const salt = await Aes.randomKey(16) // 128-bit salt
  const iv = await Aes.randomKey(16) // 128-bit iv
  const key = await getDerivedKey(password, salt, VERSION)
  const cipher = await Aes.encrypt(data, key, iv, 'aes-256-cbc')

  return JSON.stringify({
    cipher,
    iv,
    salt,
    version: VERSION
  })
}

export async function decrypt(
  encryptedData: string,
  password: string
): Promise<DecryptedData> {
  const { cipher, iv, salt, version } = JSON.parse(
    encryptedData
  ) as EncryptedData

  if (salt === undefined)
    throw new NoSaltError({
      message: 'data has no salt'
    })

  // we only start storing version info from version 2
  // so if version is undefined, it means data was encrypted using version 1 config
  const versionToUse = version === undefined ? 1 : Number(version)

  const key = await getDerivedKey(password, salt, versionToUse)
  const data = (await Aes.decrypt(cipher, key, iv, 'aes-256-cbc')) as string

  return {
    version: versionToUse,
    data
  }
}
