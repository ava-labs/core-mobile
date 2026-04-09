import LedgerService from 'services/ledger/LedgerService'
import {
  AvalancheKey,
  ExtendedPublicKey,
  LedgerKeys,
  PublicKeyInfo
} from 'services/ledger/types'
import {
  deriveAddressesFromXpub,
  deriveAddressesFromPublicKeys
} from 'services/ledger/deriveAddressesOffline'
import { derivePublicKey, extendedPublicKeyToXpub } from 'utils/bip32'
import { Curve } from 'utils/publicKeys'

export type NetworkKeys = {
  mainnet: Record<number, LedgerKeys>
  testnet: Record<number, LedgerKeys>
}

/**
 * Builds mainnet/testnet LedgerKeys for the first account by deriving the
 * opposite-network addresses offline. The "current" network comes from the
 * device; the "opposite" is derived from xpubs (BIP44) or raw public keys.
 */
export function buildFirstAccountKeys(params: {
  firstAccountKeys: AvalancheKey
  isBIP44: boolean
  isDeveloperMode: boolean
  startIndex: number
}): NetworkKeys {
  const { firstAccountKeys, isBIP44, isDeveloperMode, startIndex } = params

  const oppositeAddresses = isBIP44
    ? deriveAddressesFromXpub(
        firstAccountKeys.xpubs.evm,
        firstAccountKeys.xpubs.avalanche,
        !isDeveloperMode
      )
    : deriveAddressesFromPublicKeys(
        firstAccountKeys.publicKeys[0]?.key ?? '',
        firstAccountKeys.publicKeys[1]?.key ?? '',
        !isDeveloperMode
      )

  const oppositeKey: AvalancheKey = {
    addresses: oppositeAddresses,
    xpubs: firstAccountKeys.xpubs,
    publicKeys: firstAccountKeys.publicKeys
  }

  const current: LedgerKeys = {
    avalancheKeys: firstAccountKeys,
    solanaKeys: []
  }
  const opposite: LedgerKeys = {
    avalancheKeys: oppositeKey,
    solanaKeys: []
  }

  return {
    mainnet: { [startIndex]: isDeveloperMode ? opposite : current },
    testnet: { [startIndex]: isDeveloperMode ? current : opposite }
  }
}

/**
 * Derives mainnet/testnet LedgerKeys for accounts 1..N using BIP44 xpubs.
 * Each account shares the EVM xpub from account 0; the Avalanche xpub is
 * reconstructed from the raw public key + chain code returned by the device.
 */
export function deriveBIP44RangeKeys(
  xpubRange: Array<{
    evm: ExtendedPublicKey
    avalanche: ExtendedPublicKey
  } | null>,
  evmAccount0Xpub: string
): NetworkKeys {
  const mainnet: Record<number, LedgerKeys> = {}
  const testnet: Record<number, LedgerKeys> = {}

  for (let i = 0; i < xpubRange.length; i++) {
    const xpubs = xpubRange[i]
    if (!xpubs) continue

    const idx = i + 1
    const avalancheXpub = extendedPublicKeyToXpub(
      xpubs.avalanche.key,
      xpubs.avalanche.chainCode
    )

    const mainnetAddresses = deriveAddressesFromXpub(
      evmAccount0Xpub,
      avalancheXpub,
      false,
      idx
    )
    const testnetAddresses = deriveAddressesFromXpub(
      evmAccount0Xpub,
      avalancheXpub,
      true,
      idx
    )

    const evmPubKey =
      derivePublicKey(evmAccount0Xpub, 0, idx)?.toString('hex') ?? ''
    const avalanchePubKey =
      derivePublicKey(avalancheXpub, 0, 0)?.toString('hex') ?? ''

    const publicKeys: PublicKeyInfo[] = [
      {
        key: evmPubKey,
        derivationPath: `m/44'/60'/${idx}'/0/0`,
        curve: Curve.SECP256K1
      },
      {
        key: avalanchePubKey,
        derivationPath: `m/44'/9000'/${idx}'/0/0`,
        curve: Curve.SECP256K1
      }
    ]

    const buildKeys = (
      addresses: ReturnType<typeof deriveAddressesFromXpub>
    ): LedgerKeys => ({
      avalancheKeys: {
        addresses,
        xpubs: { evm: evmAccount0Xpub, avalanche: avalancheXpub },
        publicKeys
      },
      solanaKeys: []
    })

    mainnet[idx] = buildKeys(mainnetAddresses)
    testnet[idx] = buildKeys(testnetAddresses)
  }

  return { mainnet, testnet }
}

/**
 * Derives mainnet/testnet LedgerKeys for accounts 1..N using Ledger Live
 * public keys (no xpubs). Each account's addresses are derived directly
 * from the EVM and Avalanche public keys.
 */
export function deriveLedgerLiveRangeKeys(
  pubKeyRange: Array<{
    evmPubKey: string
    avalanchePubKey: string
    evmPath: string
    avalanchePath: string
  } | null>
): NetworkKeys {
  const mainnet: Record<number, LedgerKeys> = {}
  const testnet: Record<number, LedgerKeys> = {}

  for (let i = 0; i < pubKeyRange.length; i++) {
    const keys = pubKeyRange[i]
    if (!keys) continue

    const idx = i + 1
    const mainnetAddresses = deriveAddressesFromPublicKeys(
      keys.evmPubKey,
      keys.avalanchePubKey,
      false
    )
    const testnetAddresses = deriveAddressesFromPublicKeys(
      keys.evmPubKey,
      keys.avalanchePubKey,
      true
    )

    const publicKeys: PublicKeyInfo[] = [
      {
        key: keys.evmPubKey,
        derivationPath: keys.evmPath,
        curve: Curve.SECP256K1
      },
      {
        key: keys.avalanchePubKey,
        derivationPath: keys.avalanchePath,
        curve: Curve.SECP256K1
      }
    ]

    const buildKeys = (
      addresses: ReturnType<typeof deriveAddressesFromPublicKeys>
    ): LedgerKeys => ({
      avalancheKeys: {
        addresses,
        xpubs: { evm: '', avalanche: '' },
        publicKeys
      },
      solanaKeys: []
    })

    mainnet[idx] = buildKeys(mainnetAddresses)
    testnet[idx] = buildKeys(testnetAddresses)
  }

  return { mainnet, testnet }
}

/**
 * Fetches extended public keys (BIP44) or public keys (Ledger Live) from
 * the device for accounts 1..count-1, then derives mainnet/testnet
 * LedgerKeys for each. Returns empty maps when count <= 1.
 */
export async function deriveRangeKeys(
  count: number,
  isBIP44: boolean,
  evmAccount0Xpub: string
): Promise<NetworkKeys> {
  if (count <= 1) return { mainnet: {}, testnet: {} }

  if (isBIP44) {
    const xpubRange = await LedgerService.getExtendedPublicKeysForRange(
      1,
      count - 1
    )
    return deriveBIP44RangeKeys(xpubRange, evmAccount0Xpub)
  }

  const pubKeyRange = await LedgerService.getPublicKeysForRange(1, count - 1)
  return deriveLedgerLiveRangeKeys(pubKeyRange)
}
