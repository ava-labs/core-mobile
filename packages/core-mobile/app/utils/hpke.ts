import {
  CipherSuite,
  DhkemP521HkdfSha512,
  HkdfSha512,
  Aes256Gcm
} from '@hpke/core'

const suite = new CipherSuite({
  kem: new DhkemP521HkdfSha512(),
  kdf: new HkdfSha512(),
  aead: new Aes256Gcm()
})

export async function encrypt(
  message: string,
  key: string,
  keyID: string
): Promise<{ encrypted: string; enc: string }> {
  const publicKey = await suite.kem.deserializePublicKey(
    Buffer.from(key, 'base64')
  )

  const sender = await suite.createSenderContext({
    recipientPublicKey: publicKey
  })

  const aad = keyID !== undefined ? new TextEncoder().encode(keyID) : undefined
  const data = new TextEncoder().encode(message)
  const ct = await sender.seal(data, aad)

  const encrypted = Buffer.from(ct).toString('base64')
  const enc = Buffer.from(sender.enc).toString('base64')

  return { encrypted, enc }
}
