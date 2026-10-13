import { utils } from '@avalabs/avalanchejs'
import bs58 from 'bs58'
import { stripAddressPrefix } from 'common/utils/stripAddressPrefix'
import { isAddress } from 'viem'
import SentryService from 'services/sentry/SentryService'
import { SentryTag } from 'services/sentry/types'
import { LedgerReturnCode } from './types'

/**
 * The two address calls return different shapes. `getAddressAndPubKey` carries
 * `returnCode`/`errorMessage`, a `hash` Buffer, and a `publicKey` Buffer;
 * `getETHAddress` carries neither `returnCode` nor `hash`, and its
 * `publicKey` is a hex string rather than a Buffer (see `processGetAddrResponse`
 * vs. `getETHAddress` in `@avalabs/hw-app-avalanche`). `publicKey` is typed as
 * the union of both so this one interface can describe either reply; callers
 * that care about its byte length narrow with `Buffer.isBuffer` first.
 */
export interface LedgerAddressReply {
  address?: string
  returnCode?: number
  errorMessage?: string
  hash?: Buffer
  publicKey?: Buffer | string
}

type ReplySubject = 'address' | 'public key'

const PREVIEW_MAX_LENGTH = 12

/**
 * Previews a string for logs/telemetry: at most 12 characters, with an
 * ellipsis appended when truncated. A genuine bech32/EVM address can reach
 * these failure branches, and Sentry's scrubber does not redact addresses, so
 * every raw-value mention in a thrown message or in telemetry goes through
 * this first. An empty string is returned unchanged so the documented
 * `(raw: "")` error text stays stable.
 */
const previewString = (value: string): string =>
  value.length > PREVIEW_MAX_LENGTH
    ? `${value.slice(0, PREVIEW_MAX_LENGTH)}…`
    : value

interface FailDiagnostics {
  returnCode?: number
  addressType?: string
  addressLength?: number
  addressPreview?: string
  publicKeyLength?: number
  hashLength?: number
}

type FailDetails = FailDiagnostics & { reason: string }

/**
 * Reports a validation failure to Sentry before throwing. The message is a
 * stable string (reason/diagnostics carry the variable part) and the
 * fingerprint omits `reason` so differing failure text doesn't fragment
 * grouping — every failure for the same call+subject lands in one issue.
 */
const fail = (
  call: string,
  subject: ReplySubject,
  details: FailDetails
): never => {
  const { reason, ...diagnostics } = details

  try {
    SentryService.captureMessage(
      'Ledger device reply failed validation',
      { call, subject, reason, ...diagnostics },
      { source: SentryTag.Ledger },
      ['ledger-reply-validation', call, subject]
    )
  } catch {
    // Telemetry must never mask the real validation error.
  }

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
  const publicKey = reply?.publicKey
  // publicKey (33B) + hash (20B) present alongside an empty address means the
  // frame was cut exactly at the address boundary; a short publicKey instead
  // points at a different kind of corruption (CP-14964).
  const diagnostics: FailDiagnostics = {
    returnCode: reply?.returnCode,
    addressType: typeof address,
    addressLength: typeof address === 'string' ? address.length : undefined,
    addressPreview:
      typeof address === 'string' ? previewString(address) : undefined,
    publicKeyLength: Buffer.isBuffer(publicKey) ? publicKey.length : undefined,
    hashLength: reply?.hash?.length
  }

  if (typeof address !== 'string') {
    return fail(call, 'address', {
      reason: `expected a string, got ${typeof address}`,
      ...diagnostics
    })
  }

  const body = stripAddressPrefix(address)

  if (body.length === 0) {
    return fail(call, 'address', {
      reason: `empty address body (raw: ${JSON.stringify(
        previewString(address)
      )})`,
      ...diagnostics
    })
  }

  let hrp: string
  try {
    ;[hrp] = utils.parseBech32(body)
  } catch {
    return fail(call, 'address', {
      reason: `not a valid bech32 address (raw: ${JSON.stringify(
        previewString(address)
      )})`,
      ...diagnostics
    })
  }

  if (expectedHrp !== undefined && hrp !== expectedHrp) {
    return fail(call, 'address', {
      reason: `expected hrp "${expectedHrp}", got "${hrp}" (raw: ${JSON.stringify(
        previewString(address)
      )})`,
      ...diagnostics
    })
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
  const publicKey = reply?.publicKey
  const diagnostics: FailDiagnostics = {
    returnCode: reply?.returnCode,
    addressType: typeof address,
    addressLength: typeof address === 'string' ? address.length : undefined,
    addressPreview:
      typeof address === 'string' ? previewString(address) : undefined,
    publicKeyLength: Buffer.isBuffer(publicKey) ? publicKey.length : undefined,
    hashLength: reply?.hash?.length
  }

  if (typeof address !== 'string') {
    return fail(call, 'address', {
      reason: `expected a string, got ${typeof address}`,
      ...diagnostics
    })
  }

  if (!isAddress(address)) {
    return fail(call, 'address', {
      reason: `not a valid EVM address (raw: ${JSON.stringify(
        previewString(address)
      )})`,
      ...diagnostics
    })
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
  const diagnostics: FailDiagnostics = {
    returnCode: reply?.returnCode,
    publicKeyLength: Buffer.isBuffer(publicKey) ? publicKey.length : undefined
  }

  if (!Buffer.isBuffer(publicKey)) {
    return fail(call, 'public key', {
      reason: `expected a Buffer, got ${typeof publicKey}`,
      ...diagnostics
    })
  }

  if (publicKey.length !== COMPRESSED_SECP256K1_PUBLIC_KEY_LENGTH) {
    return fail(call, 'public key', {
      reason: `expected a ${COMPRESSED_SECP256K1_PUBLIC_KEY_LENGTH}-byte compressed public key, got ${publicKey.length} bytes`,
      ...diagnostics
    })
  }

  return publicKey
}

/**
 * Validates the Solana address returned by `@ledgerhq/device-signer-kit-solana`.
 * That signer hands back the base58-encoded ed25519 public key rather than the
 * raw bytes the Avalanche app's calls return, so the length check runs on the
 * decode rather than on the reply — an empty or truncated frame decodes to the
 * wrong byte count and fails closed here (CP-14964).
 */
export const assertDeviceSolanaBase58Address = (
  call: string,
  address?: string
): string => {
  const diagnostics: FailDiagnostics = {
    addressType: typeof address,
    addressLength: typeof address === 'string' ? address.length : undefined,
    addressPreview:
      typeof address === 'string' ? previewString(address) : undefined
  }

  if (typeof address !== 'string' || address.length === 0) {
    return fail(call, 'address', {
      reason: `expected a non-empty string, got ${typeof address}`,
      ...diagnostics
    })
  }

  let decodedLength: number
  try {
    decodedLength = bs58.decode(address).length
  } catch {
    return fail(call, 'address', {
      reason: 'not valid base58',
      ...diagnostics
    })
  }

  if (decodedLength !== SOLANA_ADDRESS_LENGTH) {
    return fail(call, 'address', {
      reason: `expected a ${SOLANA_ADDRESS_LENGTH}-byte address, got ${decodedLength} bytes`,
      ...diagnostics
    })
  }

  return address
}
