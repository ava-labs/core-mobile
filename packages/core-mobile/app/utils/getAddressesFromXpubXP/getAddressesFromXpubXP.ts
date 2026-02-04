import { Buffer } from 'buffer'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { Network as VmNetwork } from '@avalabs/vm-module-types'
import WalletService from 'services/wallet/WalletService'
import { WalletType } from 'services/wallet/types'
import { stripAddressPrefix } from 'common/utils/stripAddressPrefix'
import { XPAddressDictionary } from 'store/account/types'
import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import ModuleManager from 'vmModule/ModuleManager'
import { AVALANCHE_DERIVATION_PATH_PREFIX, Curve } from 'utils/publicKeys'
import { toSegments } from 'utils/toSegments'
import { AddressIndex } from '@avalabs/types'
import { GetAddressesResponse } from '../apiClient/profile/types'

type GetAddressesFromXpubParams = {
  isDeveloperMode: boolean
  walletId: string
  walletType: WalletType
  accountIndex: number
  onlyWithActivity: boolean
}

export type GetAddressesFromXpubResult = {
  xpAddresses: AddressIndex[]
  xpAddressDictionary: XPAddressDictionary
}

const EMPTY_RESULT: GetAddressesFromXpubResult = {
  xpAddresses: [],
  xpAddressDictionary: {} as XPAddressDictionary
}

type ExternalAddress = GetAddressesResponse['externalAddresses'][number]
type InternalAddress = GetAddressesResponse['internalAddresses'][number]

const convertNetworkAddressesToDictionary = (
  response: GetAddressesResponse
): XPAddressDictionary => {
  const dictionary: XPAddressDictionary = {} as XPAddressDictionary

  response.externalAddresses.forEach((addressItem: ExternalAddress) => {
    dictionary[stripAddressPrefix(addressItem.address)] = {
      space: 'e',
      index: addressItem.index,
      hasActivity: addressItem.hasActivity
    }
  })

  response.internalAddresses.forEach((addressItem: InternalAddress) => {
    dictionary[stripAddressPrefix(addressItem.address)] = {
      space: 'i',
      index: addressItem.index,
      hasActivity: addressItem.hasActivity
    }
  })

  return dictionary
}

const mergeProfileResponses = (
  avmAddresses: GetAddressesResponse,
  pvmAddresses: GetAddressesResponse
): XPAddressDictionary => {
  return {
    ...convertNetworkAddressesToDictionary(avmAddresses),
    ...convertNetworkAddressesToDictionary(pvmAddresses)
  }
}

const buildSeedlessXpDictionary = async ({
  accountIndex,
  isTestnet
}: {
  accountIndex: number
  isTestnet: boolean
}): Promise<GetAddressesFromXpubResult> => {
  const storedPubKeys = await SeedlessPubKeysStorage.retrieve()
  const avalanchePubKeys = storedPubKeys.filter(
    pubKey =>
      pubKey.curve === Curve.SECP256K1 &&
      pubKey.derivationPath.startsWith(
        `${AVALANCHE_DERIVATION_PATH_PREFIX}${accountIndex}'/`
      )
  )

  if (!avalanchePubKeys.length) {
    return EMPTY_RESULT
  }

  const provider = await ModuleManager.avalancheModule.getProvider({
    isTestnet
  } as VmNetwork)

  const dictionary: XPAddressDictionary = {} as XPAddressDictionary

  avalanchePubKeys.forEach(pubKey => {
    const derivation = parseSeedlessDerivationPath(pubKey.derivationPath)
    if (!derivation) {
      return
    }

    const bech32Address = provider.getAddress(
      Buffer.from(pubKey.key, 'hex'),
      'X'
    )

    dictionary[stripAddressPrefix(bech32Address)] = {
      space: derivation.space,
      index: derivation.index,
      hasActivity: false
    }
  })

  return {
    xpAddresses: toAddressIndexArray(dictionary),
    xpAddressDictionary: dictionary
  }
}

const parseSeedlessDerivationPath = (
  derivationPath: string
):
  | {
      space: 'i' | 'e'
      index: number
    }
  | undefined => {
  let change: number | undefined
  let addressIndex: number | undefined

  try {
    const segments = toSegments(derivationPath)
    change = segments.change
    addressIndex = segments.addressIndex
  } catch (error) {
    return undefined
  }

  return {
    space: change === 1 ? 'i' : 'e',
    index: addressIndex
  }
}

export const getAddressesFromXpubXP = async ({
  isDeveloperMode,
  walletId,
  walletType,
  accountIndex,
  onlyWithActivity
}: GetAddressesFromXpubParams): Promise<GetAddressesFromXpubResult> => {
  if (walletType === WalletType.SEEDLESS) {
    return buildSeedlessXpDictionary({
      accountIndex,
      isTestnet: isDeveloperMode
    })
  }

  if (!WalletService.hasXpub(walletType)) {
    return EMPTY_RESULT
  }

  const [avmAddresses, pvmAddresses] = await Promise.all([
    WalletService.getAddressesFromXpubXP({
      walletId,
      walletType,
      networkType: NetworkVMType.AVM,
      isTestnet: isDeveloperMode,
      onlyWithActivity,
      accountIndex
    }),
    WalletService.getAddressesFromXpubXP({
      walletId,
      walletType,
      networkType: NetworkVMType.PVM,
      isTestnet: isDeveloperMode,
      onlyWithActivity,
      accountIndex
    })
  ])

  const xpAddressDictionary = mergeProfileResponses(avmAddresses, pvmAddresses)

  return {
    xpAddresses: toAddressIndexArray(xpAddressDictionary),
    xpAddressDictionary
  }
}

const toAddressIndexArray = (
  dictionary: XPAddressDictionary
): AddressIndex[] => {
  return Object.keys(dictionary)
    .sort((a, b) => {
      const indexA = dictionary[a]?.index ?? 0
      const indexB = dictionary[b]?.index ?? 0
      // Sort by index first
      if (indexA !== indexB) {
        return indexA - indexB
      }
      // If same index, sort lexicographically
      return a.localeCompare(b)
    })
    .map(address => ({
      address,
      index: dictionary[address]?.index ?? 0
    }))
}

export const getXpubXPIfAvailable = async ({
  walletId,
  walletType,
  accountIndex
}: {
  walletId: string
  walletType: WalletType
  accountIndex: number
}): Promise<string | undefined> => {
  let xpubXP

  try {
    xpubXP = await WalletService.getRawXpubXP({
      walletId,
      walletType,
      accountIndex
    })
  } catch (error) {
    xpubXP = undefined
  }

  return xpubXP
}
