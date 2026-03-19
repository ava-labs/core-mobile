import { RpcMethod } from '@avalabs/vm-module-types'
import type { SigningData, DisplayData } from '@avalabs/vm-module-types'
import type { RpcRequest } from '@avalabs/vm-module-types'
import { parseSiweMessage } from './parseSiweMessage'
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

  const siwe = parseSiweMessage(message)
  if (!siwe) return displayData

  const alert = validateSiweOrigin(siwe, request.dappInfo.url)
  if (!alert) return displayData

  return { ...displayData, alert }
}

function hexToUtf8(hex: string): string | undefined {
  try {
    const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex
    const bytes = new Uint8Array(
      cleaned.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) ?? []
    )
    return new TextDecoder().decode(bytes)
  } catch {
    return undefined
  }
}
