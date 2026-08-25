import { utils } from '@avalabs/avalanchejs'
import { stripAddressPrefix } from 'common/utils/stripAddressPrefix'
import { isAddress } from 'viem'
import { LedgerReturnCode } from './types'

/**
 * The two address calls return different shapes. `getAddressAndPubKey` carries
 * `returnCode`/`errorMessage`; `getETHAddress` carries neither, so the return
 * code can only be enforced when it is actually present.
 */
export interface LedgerAddressReply {
  address?: string
  returnCode?: number
  errorMessage?: string
}

type ReplySubject = 'address' | 'public key'

const fail = (call: string, subject: ReplySubject, reason: string): never => {
  throw new Error(`Ledger ${call} returned an invalid ${subject}: ${reason}`)
}

const assertReturnCode = (call: string, reply?: LedgerAddressReply): void => {
  const code = reply?.returnCode

  if (typeof code === 'number' && code !== LedgerReturnCode.SUCCESS) {
    throw new Error(
      `Ledger ${call} failed with status 0x${code.toString(16)}: ${
        reply?.errorMessage ?? 'unknown error'
      }`
    )
  }
}

/**
 * Validates a bech32 address reply and returns it with the chain alias
 * stripped, ready for the caller to re-prefix for its target chain. The device
 * prefixes every bech32 reply with `P-` regardless of the derivation path
 * requested, so both the X/P and CoreEth call sites go through here.
 */
export const assertDeviceBech32Address = (
  call: string,
  reply?: LedgerAddressReply,
  expectedHrp?: string
): string => {
  assertReturnCode(call, reply)

  const address = reply?.address

  if (typeof address !== 'string') {
    return fail(call, 'address', `expected a string, got ${typeof address}`)
  }

  const body = stripAddressPrefix(address)

  if (body.length === 0) {
    return fail(
      call,
      'address',
      `empty address body (raw: ${JSON.stringify(address)})`
    )
  }

  let hrp: string
  try {
    ;[hrp] = utils.parseBech32(body)
  } catch {
    return fail(
      call,
      'address',
      `not a valid bech32 address (raw: ${JSON.stringify(address)})`
    )
  }

  if (expectedHrp !== undefined && hrp !== expectedHrp) {
    return fail(
      call,
      'address',
      `expected hrp "${expectedHrp}", got "${hrp}" (raw: ${JSON.stringify(
        address
      )})`
    )
  }

  return body
}

/**
 * Validates an EVM address reply. Kept separate from the bech32 path because
 * `getETHAddress` has no `returnCode` to check and its address is 0x-hex.
 */
export const assertDeviceEvmAddress = (
  call: string,
  reply?: LedgerAddressReply
): string => {
  assertReturnCode(call, reply)

  const address = reply?.address

  if (typeof address !== 'string') {
    return fail(call, 'address', `expected a string, got ${typeof address}`)
  }

  if (!isAddress(address)) {
    return fail(
      call,
      'address',
      `not a valid EVM address (raw: ${JSON.stringify(address)})`
    )
  }

  return address
}

const COMPRESSED_SECP256K1_PUBLIC_KEY_LENGTH = 33
const SOLANA_ADDRESS_LENGTH = 32

export interface LedgerPublicKeyReply {
  publicKey?: Buffer
  returnCode?: number
  errorMessage?: string
}

/**
 * Validates a public key reply from `getAddressAndPubKey`. The secp256k1
 * pubkey-to-bech32 derivation downstream does not check length itself, so a
 * truncated (or empty) `publicKey` that still carries SUCCESS would otherwise
 * silently derive a well-formed address nobody controls. See CP-14964.
 */
export const assertDevicePublicKey = (
  call: string,
  reply?: LedgerPublicKeyReply
): Buffer => {
  assertReturnCode(call, reply as LedgerAddressReply | undefined)

  const publicKey = reply?.publicKey

  if (!Buffer.isBuffer(publicKey)) {
    return fail(
      call,
      'public key',
      `expected a Buffer, got ${typeof publicKey}`
    )
  }

  if (publicKey.length !== COMPRESSED_SECP256K1_PUBLIC_KEY_LENGTH) {
    return fail(
      call,
      'public key',
      `expected a ${COMPRESSED_SECP256K1_PUBLIC_KEY_LENGTH}-byte compressed public key, got ${publicKey.length} bytes`
    )
  }

  return publicKey
}

export interface LedgerSolanaAddressReply {
  address?: Buffer
  returnCode?: number
  errorMessage?: string
}

/**
 * Validates a Solana address reply. Unlike the Avalanche bech32/EVM calls,
 * `getAddress` returns the raw 32-byte ed25519 public key as a Buffer rather
 * than an encoded string, so it needs its own length check ahead of the
 * base58 encode.
 */
export const assertDeviceSolanaAddress = (
  call: string,
  reply?: LedgerSolanaAddressReply
): Buffer => {
  assertReturnCode(call, reply as LedgerAddressReply | undefined)

  const address = reply?.address

  if (!Buffer.isBuffer(address)) {
    return fail(call, 'address', `expected a Buffer, got ${typeof address}`)
  }

  if (address.length !== SOLANA_ADDRESS_LENGTH) {
    return fail(
      call,
      'address',
      `expected a ${SOLANA_ADDRESS_LENGTH}-byte address, got ${address.length} bytes`
    )
  }

  return address
}
