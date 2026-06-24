import {
  AddressItem,
  DateItem,
  DetailItem,
  DetailItemType,
  MessageTypes,
  TextItem,
  TypedData
} from '@avalabs/vm-module-types'
import { KnownTypedDataKind, ParsedKnownTypedData } from './types'

type TypedDataObject = TypedData<MessageTypes>

// ---- low-level helpers -----------------------------------------------------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * V3/V4 typed data is an object with `types`/`primaryType`/`domain`/`message`.
 * The V1 variant is an array, which we don't summarize.
 */
const isTypedDataObject = (data: unknown): data is TypedDataObject =>
  isRecord(data) &&
  'primaryType' in data &&
  'message' in data &&
  isRecord(data.message)

const asString = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'bigint')
    return value.toString()
  return undefined
}

const isAddress = (value: unknown): value is string =>
  typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value)

const textItem = (label: string, value: string): TextItem => ({
  type: DetailItemType.TEXT,
  label,
  value,
  alignment: 'horizontal'
})

const addressItem = (label: string, value: string): AddressItem => ({
  type: DetailItemType.ADDRESS,
  label,
  value
})

const dateItem = (label: string, value: string): DateItem => ({
  type: DetailItemType.DATE,
  label,
  value
})

/**
 * Builds a DATE item when the value looks like a unix-seconds timestamp, else a
 * plain text item. Permit deadlines are sometimes set to a sentinel max value
 * (no expiry); we surface that explicitly rather than rendering a nonsense date.
 */
const deadlineItem = (
  label: string,
  value: unknown
): DetailItem | undefined => {
  const str = asString(value)
  if (str === undefined) return undefined

  let seconds: bigint
  try {
    seconds = BigInt(str)
  } catch {
    return undefined
  }

  // Permit2 uses (2^48 - 1); EIP-2612 commonly uses (2^256 - 1) for "no expiry".
  if (seconds <= 0n || seconds >= 281474976710655n) {
    return textItem(label, 'No expiry')
  }
  return dateItem(label, seconds.toString())
}

// Push helpers keep each parser flat: the conditional lives here, so the parser
// reads as a straight-line list of fields rather than a tree of `if`s.
const pushAddress = (
  items: DetailItem[],
  label: string,
  value: unknown
): void => {
  if (isAddress(value)) items.push(addressItem(label, value))
}

const pushAmount = (
  items: DetailItem[],
  label: string,
  value: unknown
): void => {
  const str = asString(value)
  if (str !== undefined) items.push(textItem(label, str))
}

const pushDeadline = (
  items: DetailItem[],
  label: string,
  value: unknown
): void => {
  const item = deadlineItem(label, value)
  if (item) items.push(item)
}

// ---- per-protocol parsers --------------------------------------------------

/**
 * EIP-2612 ERC-20 Permit: gasless token allowance granted by signature.
 * primaryType `Permit`, message { owner, spender, value, nonce, deadline }.
 */
const parseErc20Permit = (
  data: TypedDataObject
): ParsedKnownTypedData | null => {
  if (data.primaryType !== 'Permit') return null

  const msg = data.message
  // Distinguish EIP-2612 from Permit2's single-permit (also `Permit`-ish):
  // EIP-2612 carries owner/spender/value at the top level.
  if (!('spender' in msg) || !('value' in msg)) return null

  const items: DetailItem[] = []
  const tokenName = asString(data.domain.name)
  if (tokenName) items.push(textItem('Token', tokenName))
  pushAddress(items, 'Token address', data.domain.verifyingContract)
  pushAddress(items, 'Owner', msg.owner)
  pushAddress(items, 'Spender', msg.spender)
  pushAmount(items, 'Amount', msg.value)
  pushDeadline(items, 'Deadline', msg.deadline)

  return {
    kind: KnownTypedDataKind.ERC20_PERMIT,
    section: { title: 'Token approval (Permit)', items }
  }
}

const PERMIT2_PRIMARY_TYPES = [
  'PermitSingle',
  'PermitBatch',
  'PermitTransferFrom',
  'PermitBatchTransferFrom'
]

// A single Permit2 allowance/transfer entry, used for both the single and the
// batched (`details[]` / `permitted[]`) variants.
const pushPermit2Entry = (
  items: DetailItem[],
  entry: unknown,
  suffix: string
): void => {
  if (!isRecord(entry)) return
  pushAddress(items, `Token${suffix}`, entry.token)
  pushAmount(items, `Amount${suffix}`, entry.amount)
  pushDeadline(items, `Expiration${suffix}`, entry.expiration)
}

const pushPermit2Entries = (items: DetailItem[], value: unknown): void => {
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      pushPermit2Entry(items, entry, ` ${index + 1}`)
    )
  } else {
    pushPermit2Entry(items, value, '')
  }
}

/**
 * Uniswap Permit2: a single allowance contract used by Uniswap and others.
 * Detected by domain.name === 'Permit2' or one of the known primary types.
 * Covers PermitSingle/Batch (`details`) and PermitTransferFrom (`permitted`).
 */
const parsePermit2 = (data: TypedDataObject): ParsedKnownTypedData | null => {
  const isPermit2 =
    data.domain.name === 'Permit2' ||
    PERMIT2_PRIMARY_TYPES.includes(String(data.primaryType))
  if (!isPermit2) return null

  const msg = data.message
  const items: DetailItem[] = []

  pushAddress(items, 'Spender', msg.spender)
  pushPermit2Entries(items, msg.details)
  pushPermit2Entries(items, msg.permitted)
  pushDeadline(items, 'Signature deadline', msg.sigDeadline)
  if (!('sigDeadline' in msg)) pushDeadline(items, 'Deadline', msg.deadline)

  if (items.length === 0) return null

  return {
    kind: KnownTypedDataKind.PERMIT2,
    section: { title: 'Token approval (Permit2)', items }
  }
}

const pushSeaportOfferItem = (
  items: DetailItem[],
  entry: unknown,
  index: number
): void => {
  if (!isRecord(entry)) return
  pushAddress(items, `Offer ${index + 1} token`, entry.token)
  pushAmount(items, `Offer ${index + 1} amount`, entry.startAmount)
}

const pushSeaportConsiderationItem = (
  items: DetailItem[],
  entry: unknown,
  index: number
): void => {
  if (!isRecord(entry)) return
  pushAmount(items, `Receive ${index + 1} amount`, entry.startAmount)
  pushAddress(items, `Recipient ${index + 1}`, entry.recipient)
}

/**
 * OpenSea Seaport order. primaryType `OrderComponents` or domain.name `Seaport`.
 * We summarize what the signer offers vs. what they receive, plus validity.
 */
const parseSeaport = (data: TypedDataObject): ParsedKnownTypedData | null => {
  const isSeaport =
    data.primaryType === 'OrderComponents' || data.domain.name === 'Seaport'
  if (!isSeaport) return null

  const msg = data.message
  const items: DetailItem[] = []

  pushAddress(items, 'Offerer', msg.offerer)

  const offer = msg.offer
  if (Array.isArray(offer)) {
    items.push(textItem('Offering', `${offer.length} item(s)`))
    offer.forEach((entry, index) => pushSeaportOfferItem(items, entry, index))
  }

  const consideration = msg.consideration
  if (Array.isArray(consideration)) {
    items.push(textItem('Receiving', `${consideration.length} item(s)`))
    consideration.forEach((entry, index) =>
      pushSeaportConsiderationItem(items, entry, index)
    )
  }

  pushDeadline(items, 'Start time', msg.startTime)
  pushDeadline(items, 'End time', msg.endTime)

  if (items.length === 0) return null

  return {
    kind: KnownTypedDataKind.SEAPORT,
    section: { title: 'NFT order (Seaport)', items }
  }
}

/**
 * Parses an EIP-712 typed-data payload into a human-readable DetailSection when
 * it matches a well-known schema (EIP-2612 Permit, Uniswap Permit2, OpenSea
 * Seaport). Returns null otherwise so callers fall back to the raw message.
 *
 * Never throws — a malformed payload must not be able to block the approval UI.
 */
export const parseKnownTypedData = (
  data: unknown
): ParsedKnownTypedData | null => {
  try {
    if (!isTypedDataObject(data)) return null

    return (
      parseErc20Permit(data) ?? parsePermit2(data) ?? parseSeaport(data) ?? null
    )
  } catch {
    return null
  }
}
