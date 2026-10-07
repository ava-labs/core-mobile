import {
  DeviceManagementKit,
  DeviceSessionId
} from '@ledgerhq/device-management-kit'
import * as Sentry from '@sentry/react-native'
import { AllowedSentryBreadcrumbCategory } from 'services/sentry/types'
import { LedgerReturnCode } from './types'
import { describeDmkError } from './describeDmkError'

// Lc is a single byte, so one APDU carries at most 255 bytes of payload.
const MAX_APDU_PAYLOAD = 255

/**
 * Thrown when the device answers with a status word the caller did not allow.
 *
 * `statusCode` is the numeric status word, which is the property
 * `@avalabs/hw-app-avalanche`'s `processErrorResponse` reads to turn a rejection
 * into its `{ returnCode, errorMessage }` shape — the same contract
 * `@ledgerhq/hw-transport`'s `TransportStatusError` had.
 */
class LedgerApduStatusError extends Error {
  readonly statusCode: number

  constructor(statusCode: number) {
    super(
      `Ledger device returned 0x${statusCode.toString(16).padStart(4, '0')}`
    )
    this.name = 'LedgerApduStatusError'
    this.statusCode = statusCode
    Object.setPrototypeOf(this, LedgerApduStatusError.prototype)
  }
}

/**
 * Adapts a Device Management Kit session to the `send`-shaped transport
 * `@avalabs/hw-app-avalanche` expects, so the Avalanche app SDK can drive a DMK
 * session without a legacy `@ledgerhq/hw-transport` instance.
 */
export class DmkApduTransport {
  constructor(
    private readonly dmk: DeviceManagementKit,
    private readonly sessionId: DeviceSessionId
  ) {}

  // eslint-disable-next-line max-params
  send = async (
    cla: number,
    ins: number,
    p1: number,
    p2: number,
    data: Buffer = Buffer.alloc(0),
    statusList: number[] = [LedgerReturnCode.SUCCESS],
    options?: { abortTimeoutMs?: number }
  ): Promise<Buffer> => {
    if (data.length > MAX_APDU_PAYLOAD) {
      throw new Error(
        `APDU payload of ${data.length} bytes exceeds the ${MAX_APDU_PAYLOAD}-byte limit`
      )
    }

    const apdu = new Uint8Array(5 + data.length)
    apdu[0] = cla
    apdu[1] = ins
    apdu[2] = p1
    apdu[3] = p2
    apdu[4] = data.length
    apdu.set(data, 5)

    let response: Awaited<ReturnType<DeviceManagementKit['sendApdu']>>
    try {
      response = await this.dmk.sendApdu({
        sessionId: this.sessionId,
        apdu,
        abortTimeout: options?.abortTimeoutMs
      })
    } catch (error) {
      recordApduBreadcrumb({ cla, ins, failure: errorTag(error) })
      // Without a real Error, hw-app-avalanche's processErrorResponse reports
      // the DMK rejection as "0xffff: [object Object]", dropping its _tag.
      throw new Error(
        `Ledger APDU exchange failed: ${describeDmkError(error)}`,
        {
          cause: error
        }
      )
    }

    // SW1/SW2 as one 16-bit word, e.g. 0x90 0x00 -> 0x9000
    const statusCode =
      (response.statusCode[0] ?? 0) * 256 + (response.statusCode[1] ?? 0)

    recordApduBreadcrumb({
      cla,
      ins,
      replyLength: response.data.length,
      statusCode
    })

    // A truncated BLE frame can leave fewer than two status bytes; padding the
    // missing byte with zero would turn [0x90] into a false 0x9000 success.
    if (response.statusCode.length !== 2) {
      throw new Error(
        `Ledger reply has a ${response.statusCode.length}-byte status word; expected 2`
      )
    }

    if (!statusList.includes(statusCode)) {
      throw new LedgerApduStatusError(statusCode)
    }

    return Buffer.concat([
      new Uint8Array(response.data),
      new Uint8Array(response.statusCode)
    ])
  }
}

// Frame-metadata-only breadcrumb (never payload bytes) for every APDU
// exchange. Sentry attaches recent breadcrumbs to any error captured
// afterwards, so a later validateDeviceAddress capture carries the reply
// length and status word — the signal that distinguishes a truncated
// transport frame from a device/app that legitimately returned empty (CP-14964).
const recordApduBreadcrumb = (
  frame: { cla: number; ins: number } & (
    | { replyLength: number; statusCode: number }
    | { failure: string }
  )
): void => {
  try {
    Sentry.addBreadcrumb({
      category: AllowedSentryBreadcrumbCategory.LedgerApdu,
      level: 'failure' in frame ? 'warning' : 'info',
      data: {
        cla: frame.cla.toString(16).padStart(2, '0'),
        ins: frame.ins.toString(16).padStart(2, '0'),
        ...('failure' in frame
          ? { failure: frame.failure }
          : {
              replyLength: frame.replyLength,
              statusWord: frame.statusCode.toString(16).padStart(4, '0')
            })
      }
    })
  } catch {
    // Breadcrumb capture must never break a real APDU exchange.
  }
}

// Only the tag/name goes into the breadcrumb: the full error text can echo
// arbitrary device output, and breadcrumbs stay frame-metadata only.
const errorTag = (error: unknown): string => {
  if (error instanceof Error) return error.name
  const tag = (error as { _tag?: unknown } | null)?._tag
  return typeof tag === 'string' ? tag : 'unknown'
}
