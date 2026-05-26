import KeystoneSDK from '@keystonehq/keystone-sdk'
import { UR } from '@ngraveio/bc-ur'
import { extendedPublicKeyToXpub } from 'utils/bip32'
import { requestKeystoneSigner } from 'features/keystone/utils'
import type { Account } from '@keystonehq/keystone-sdk/dist/types/account'
import KeystoneService from './KeystoneService'

// Response URTypes the device may emit for a KeyDerivationCall. We accept
// all three and pick the parser at runtime based on the actual response type.
const RESPONSE_UR_TYPES = [
  'crypto-account',
  'crypto-multi-accounts',
  'crypto-hdkey'
] as const

const AVAX_BIP44_COIN = "9000'"

const parseKeysFromResponse = (cbor: Buffer, urType: string): Account[] => {
  const sdk = new KeystoneSDK()
  const ur = new UR(cbor, urType)

  if (urType === 'crypto-hdkey') {
    return [sdk.parseHDKey(ur)]
  }
  if (urType === 'crypto-multi-accounts') {
    return sdk.parseMultiAccounts(ur).keys
  }
  if (urType === 'crypto-account') {
    return sdk.parseAccount(ur).keys
  }
  throw new Error(
    `[requestKeystoneAccountXpub] Unsupported response URType: ${urType}`
  )
}

const findAvaxKey = (
  keys: Account[],
  accountIndex: number
): Account | undefined => {
  const expectedSegment = `/${accountIndex}'`
  // Prefer the entry that matches both the AVAX coin type and the requested
  // account index, but fall back to any AVAX entry if the device omitted the
  // index — useful when a single-schema request was sent.
  return (
    keys.find(
      k =>
        k.path?.includes(AVAX_BIP44_COIN) && k.path?.includes(expectedSegment)
    ) ?? keys.find(k => k.path?.includes(AVAX_BIP44_COIN))
  )
}

/**
 * Asks the connected Keystone device for the AVAX xpub at
 * `m/44'/9000'/<accountIndex>'` via the QR-mode `generateKeyDerivationCall`
 * protocol. The user scans the request QR with their device, approves the
 * derivation, then scans the device's response QR back into the app.
 *
 * On success, persists the xpub via `KeystoneService.addAccountXpub` and
 * returns it so the caller can refresh derived address state immediately.
 */
export const requestKeystoneAccountXpub = async (
  accountIndex: number
): Promise<string> => {
  const sdk = new KeystoneSDK()

  const request = sdk.generateKeyDerivationCall({
    schemas: [
      {
        path: `m/44'/9000'/${accountIndex}'`,
        chainType: 'AVAX'
      }
    ]
  })

  const xpub = await new Promise<string>((resolve, reject) => {
    requestKeystoneSigner({
      request,
      responseURTypes: [...RESPONSE_UR_TYPES],
      onApprove: async (cbor: Buffer, urType: string) => {
        try {
          const keys = parseKeysFromResponse(cbor, urType)
          const avaxKey = findAvaxKey(keys, accountIndex)
          if (!avaxKey?.publicKey || !avaxKey?.chainCode) {
            reject(
              new Error(
                `Keystone response did not include an AVAX key for account ${accountIndex}`
              )
            )
            return
          }
          resolve(extendedPublicKeyToXpub(avaxKey.publicKey, avaxKey.chainCode))
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)))
        }
      },
      onReject: (message?: string) => {
        reject(new Error(message ?? 'User rejected'))
      }
    })
  })

  await KeystoneService.addAccountXpub(accountIndex, xpub)
  return xpub
}
