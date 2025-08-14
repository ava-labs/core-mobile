/* eslint-disable no-console */
import { showResult } from './utils'
const eccTiny = require('tiny-secp256k1')
const eccNoble = require('@bitcoinerlab/secp256k1')
const { BIP32Factory } = require('bip32')

export const bip32Benchmark = async () => {
  const bip32Tiny = BIP32Factory(eccTiny)
  const bip32Noble = BIP32Factory(eccNoble)

  const seed = global.Buffer.alloc(64, 1) // Fixed seed
  const nodeTiny = bip32Tiny.fromSeed(seed)
  const nodeNoble = bip32Noble.fromSeed(seed)

  const hash = global.Buffer.alloc(32, 2) // Fixed hash
  const iterations = 10

  // tiny-secp256k1 sign
  console.log('tiny-secp256k1 sign')
  let start1 = Date.now()
  for (let i = 0; i < iterations; i++) nodeTiny.sign(hash)
  let end1 = Date.now()

  // @noble/secp256k1 sign
  console.log('@noble/secp256k1 sign')
  let start2 = Date.now()
  for (let i = 0; i < iterations; i++) nodeNoble.sign(hash)
  let end2 = Date.now()

  function deriveDeep(node, depth) {
    let current = node
    for (let i = 0; i < depth; i++) {
      current = current.derive(i)
    }
  }

  const depth = 100 // how many levels deep to go

  // tiny-secp256k1 derive
  console.log('tiny-secp256k1 derive')
  let start3 = Date.now()
  for (let i = 0; i < iterations; i++) {
    deriveDeep(nodeTiny, depth)
  }
  let end3 = Date.now()

  // @noble/secp256k1 derive
  console.log('@noble/secp256k1 derive')
  let start4 = Date.now()
  for (let i = 0; i < iterations; i++) {
    deriveDeep(nodeNoble, depth)
  }
  let end4 = Date.now()

  // tiny-secp256k1 publicKey (no cache)
  console.log('tiny-secp256k1 publicKey (no cache)')
  let start5 = Date.now()
  for (let i = 0; i < iterations; i++) {
    nodeTiny.__Q = undefined
    nodeTiny.publicKey
  }
  let end5 = Date.now()

  // @noble/secp256k1 publicKey (no cache)
  console.log('@noble/secp256k1 publicKey (no cache)')
  let start6 = Date.now()
  for (let i = 0; i < iterations; i++) {
    nodeNoble.__Q = undefined
    nodeNoble.publicKey
  }
  let end6 = Date.now()

  await showResult(
    'BIP32 Benchmark Results',
    `tiny-secp256k1 sign: ${end1 - start1}ms
@noble/secp256k1 sign: ${end2 - start2}ms
tiny-secp256k1 derive: ${end3 - start3}ms
@noble/secp256k1 derive: ${end4 - start4}ms
tiny-secp256k1 publicKey (no cache): ${end5 - start5}ms
@noble/secp256k1 publicKey (no cache): ${end6 - start6}ms`
  )
}
