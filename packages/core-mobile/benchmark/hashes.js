/* eslint-disable no-console */
import { hmac } from '@noble/hashes/hmac'
import { sha256 } from '@noble/hashes/sha256'
import { sha512 } from '@noble/hashes/sha512'
import { ripemd160 } from '@noble/hashes/ripemd160'
import {
  pbkdf2 as noblePbkdf2,
  pbkdf2Async as noblePbkdf2Async
} from '@noble/hashes/pbkdf2'
import {
  createHash,
  createHmac,
  pbkdf2Sync,
  pbkdf2
} from 'react-native-quick-crypto'
import { showResult } from './utils'

export const nobleVsQuickCryptoHashBenchmark = async () => {
  const key = global.Buffer.from('mysecretkey')
  const data = global.Buffer.from('some data to hash')
  const iterations = 1000
  const pbkdf2Iterations = 2048
  const pbkdf2Len = 64
  const salt = global.Buffer.from('mysalt')

  // --- noble hmac sha512
  console.log('@noble/hashes hmacSHA512')
  let start = Date.now()
  for (let i = 0; i < iterations; i++) {
    hmac(sha512, key, data)
  }
  let end = Date.now()

  // --- quick hmac sha512
  console.log('quick-crypto hmacSHA512')
  let start2 = Date.now()
  for (let i = 0; i < iterations; i++) {
    createHmac('sha512', key).update(data).digest()
  }
  let end2 = Date.now()

  // --- noble sha256
  console.log('@noble/hashes sha256')
  let start3 = Date.now()
  for (let i = 0; i < iterations; i++) {
    sha256(data)
  }
  let end3 = Date.now()

  // --- quick sha256
  console.log('quick-crypto sha256')
  let start4 = Date.now()
  for (let i = 0; i < iterations; i++) {
    createHash('sha256').update(data).digest()
  }
  let end4 = Date.now()

  // --- noble sha512
  console.log('@noble/hashes sha512')
  let start5 = Date.now()
  for (let i = 0; i < iterations; i++) {
    sha512(data)
  }
  let end5 = Date.now()

  // --- quick sha512
  console.log('quick-crypto sha512')
  let start6 = Date.now()
  for (let i = 0; i < iterations; i++) {
    createHash('sha512').update(data).digest()
  }
  let end6 = Date.now()

  // --- noble ripemd160
  console.log('@noble/hashes ripemd160')
  let start7 = Date.now()
  for (let i = 0; i < iterations; i++) {
    ripemd160(data)
  }
  let end7 = Date.now()

  // --- quick ripemd160
  console.log('quick-crypto ripemd160')
  let start8 = Date.now()
  for (let i = 0; i < iterations; i++) {
    createHash('ripemd160').update(data).digest()
  }
  let end8 = Date.now()

  // --- noble pbkdf2 (sync)
  console.log('@noble/hashes pbkdf2Sync')
  let start9 = Date.now()
  noblePbkdf2(sha512, key, salt, { c: pbkdf2Iterations, dkLen: pbkdf2Len })
  let end9 = Date.now()

  // --- quick pbkdf2 (sync)
  console.log('quick-crypto pbkdf2Sync')
  let start10 = Date.now()
  pbkdf2Sync(key, salt, pbkdf2Iterations, pbkdf2Len, 'sha512')
  let end10 = Date.now()

  // --- noble pbkdf2 (async)
  console.log('@noble/hashes pbkdf2Async')
  let start11 = Date.now()
  await noblePbkdf2Async(sha512, key, salt, {
    c: pbkdf2Iterations,
    dkLen: pbkdf2Len
  })
  let end11 = Date.now()

  // --- quick pbkdf2 (async)
  console.log('quick-crypto pbkdf2Async')
  let start12 = Date.now()
  await new Promise((resolve, reject) => {
    pbkdf2(key, salt, pbkdf2Iterations, pbkdf2Len, 'sha512', err => {
      if (err) reject(err)
      else resolve()
    })
  })
  let end12 = Date.now()

  await showResult(
    'Hash Benchmark Results',
    `@noble/hashes hmacSHA512: ${end - start}ms
quick-crypto hmacSHA512: ${end2 - start2}ms
@noble/hashes sha256: ${end3 - start3}ms
quick-crypto sha256: ${end4 - start4}ms
@noble/hashes sha512: ${end5 - start5}ms
quick-crypto sha512: ${end6 - start6}ms
@noble/hashes ripemd160: ${end7 - start7}ms
quick-crypto ripemd160: ${end8 - start8}ms
@noble/hashes pbkdf2Sync: ${end9 - start9}ms
quick-crypto pbkdf2Sync: ${end10 - start10}ms
@noble/hashes pbkdf2Async: ${end11 - start11}ms
quick-crypto pbkdf2Async: ${end12 - start12}ms`
  )
}
