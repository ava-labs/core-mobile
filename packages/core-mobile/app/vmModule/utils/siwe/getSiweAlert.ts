import { AlertType, RpcMethod } from '@avalabs/vm-module-types'
import type { SigningData, DisplayData } from '@avalabs/vm-module-types'
import type { RpcRequest } from '@avalabs/vm-module-types'
import { parseSiweMessageStrict } from './parseSiweMessage'
import { validateSiweOrigin } from './validateSiweOrigin'

/**
 * For personal_sign requests, checks whether the message is a SIWE (EIP-4361)
 * message and validates that its domain/URI matches the requesting dApp.
 *
 * Returns an updated displayData with an alert injected if there is a mismatch,
 * or the original displayData if no issue is found.
 */
export function maybeInjectSiweAlert({
  request,
  signingData,
  displayData
}: {
  request: RpcRequest
  signingData: SigningData
  displayData: DisplayData
}): DisplayData {
  if (signingData.type !== RpcMethod.PERSONAL_SIGN) return displayData

  // Already has an alert from simulation/Blockaid — don't override it
  if (displayData.alert) return displayData

  const message = hexToUtf8(signingData.data as string)
  if (!message) return displayData

  const parsed = parseSiweMessageStrict(message)
  if (!parsed) return displayData

  // A SIWE header with a malformed/ambiguous body must never be signed
  // silently: the displayed fields could differ from what a lenient parser sees.
  if (parsed.kind === 'malformed') {
    return {
      ...displayData,
      alert: {
        type: AlertType.DANGER,
        details: {
          title: 'Malformed sign-in request',
          description:
            'This sign-in message is not formatted as a valid Sign-In with Ethereum request. Do not sign it.'
        }
      }
    }
  }

  const alert = validateSiweOrigin(parsed.message, request.dappInfo.url)
  if (!alert) return displayData

  return { ...displayData, alert }
}

// Mirrors @metamask/eth-sig-util `legacyToBuffer` (what personal_sign signs):
// a `0x`-prefixed hex string is hex-decoded; any other string is signed as
// UTF-8 text. Decoding a plain-text message as hex would hide a SIWE payload.
function hexToUtf8(data: string): string | undefined {
  try {
    if (!/^0x[0-9a-fA-F]*$/.test(data)) return data
    let cleaned = data.slice(2)
    if (cleaned.length % 2 === 1) cleaned = '0' + cleaned
    const bytes = new Uint8Array(
      cleaned.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) ?? []
    )
    return new TextDecoder().decode(bytes)
  } catch {
    return undefined
  }
}
