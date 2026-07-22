import { GetAddressesResponse } from 'utils/api/generated/profileApi.client/types.gen'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { cChainToken } from 'utils/units/knownTokens'
import {
  DerivationPathType,
  MessageTypes,
  NetworkVMType,
  RpcMethod,
  TypedData,
  TypedDataV1
} from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'
import { BigNumberish, TransactionRequest } from 'ethers'
import { BigIntLike, BytesLike, AddressLike } from '@ethereumjs/util'
import { SignTypedDataVersion } from '@metamask/eth-sig-util'
import { isTypedData } from '@avalabs/evm-module'
import isString from 'lodash.isstring'
import { LegacyTxData } from '@ethereumjs/tx'
import {
  LEDGER_ERROR_CODES,
  LedgerAppType,
  LEDGER_BLIND_SIGN_MESSAGE
} from 'services/ledger/types'
import { Network } from '@avalabs/core-chains-sdk'
import { getLedgerAppName } from 'features/ledger/utils'
import {
  AvalancheTransactionRequest,
  BtcTransactionRequest,
  SignTransactionRequest,
  SolanaTransactionRequest
} from './types'

export const hasActiveDerivedAddresses = (
  response: GetAddressesResponse
): boolean =>
  response.externalAddresses.length > 0 || response.internalAddresses.length > 0

export const MAINNET_AVAX_ASSET_ID = Avalanche.MainnetContext.avaxAssetID
export const TESTNET_AVAX_ASSET_ID = Avalanche.FujiContext.avaxAssetID

const ONE_NANO_AVAX_IN_WEI = 1_000_000_000n // 1 nAvax

export const isBtcTransactionRequest = (
  request: SignTransactionRequest
): request is BtcTransactionRequest => {
  return 'inputs' in request
}

export const isAvalancheTransactionRequest = (
  request: SignTransactionRequest
): request is AvalancheTransactionRequest => {
  return 'tx' in request
}

export const isSolanaTransactionRequest = (
  request: SignTransactionRequest
): request is SolanaTransactionRequest => {
  return 'serializedTx' in request
}

export const getAvaxAssetId = (isTestnet: boolean): string => {
  return isTestnet ? TESTNET_AVAX_ASSET_ID : MAINNET_AVAX_ASSET_ID
}

// we add some buffer to C chain base fee to gain better speed
export const addBufferToCChainBaseFee = (
  baseFee: TokenUnit, // in wei
  multiplier: number
): TokenUnit => {
  const adjustedBaseFee = baseFee.add(baseFee.mul(multiplier))

  const minAvax = new TokenUnit(
    ONE_NANO_AVAX_IN_WEI,
    cChainToken.maxDecimals,
    cChainToken.symbol
  )

  // after the Fortuna upgrade, the c-chain base fee can drop as low as 1 wei AVAX.
  // here, we enforce a minimum base fee of 1 nano AVAX;
  // otherwise, it rounds to 0 when converted back to nano AVAX
  return adjustedBaseFee.toSubUnit() >= minAvax.toSubUnit()
    ? adjustedBaseFee
    : minAvax
}

// Single source of truth for choosing the SignTypedData version from the RPC
// method. The signer (MnemonicWallet / PrivateKeyWallet) and the defense-in-depth
// verifier (assertEvmMessageSigner) MUST select the same version, otherwise a
// legitimate signature would fail recovery and be rejected as a "signer mismatch"
// (CP-14468). Keeping this in one place prevents the signer and verifier from
// drifting apart.
export const getEvmTypedDataVersion = (
  rpcMethod: RpcMethod,
  data: TypedDataV1 | TypedData<MessageTypes>
): SignTypedDataVersion => {
  switch (rpcMethod) {
    case RpcMethod.SIGN_TYPED_DATA_V3:
      return SignTypedDataVersion.V3
    case RpcMethod.SIGN_TYPED_DATA_V4:
      return SignTypedDataVersion.V4
    default:
      // eth_signTypedData / _v1 have been observed carrying a V4 payload, so we
      // detect it rather than blindly assuming V1.
      return isTypedData(data)
        ? SignTypedDataVersion.V4
        : SignTypedDataVersion.V1
  }
}

export const getAddressDerivationPath = ({
  accountIndex,
  addressIndex,
  vmType,
  derivationPathType = 'bip44'
}: {
  accountIndex: number
  addressIndex?: number
  vmType: Exclude<NetworkVMType, NetworkVMType.PVM | NetworkVMType.HVM>
  derivationPathType?: DerivationPathType
}): string => {
  let derivationPath: string | undefined
  switch (vmType) {
    case NetworkVMType.AVM:
    case NetworkVMType.CoreEth:
      derivationPath = ModuleManager.avalancheModule.buildDerivationPath({
        accountIndex,
        derivationPathType,
        addressIndex
      })[vmType]
      break
    case NetworkVMType.EVM:
      derivationPath = ModuleManager.evmModule.buildDerivationPath({
        accountIndex,
        derivationPathType
      })[vmType]
      break
    case NetworkVMType.BITCOIN:
      derivationPath = ModuleManager.bitcoinModule.buildDerivationPath({
        accountIndex,
        derivationPathType
      })[vmType]
      break
    case NetworkVMType.SVM:
      derivationPath = ModuleManager.solanaModule.buildDerivationPath({
        accountIndex,
        derivationPathType
      })[vmType]
      break
  }

  if (!derivationPath) {
    throw new Error(`Unsupported VM type: ${vmType}`)
  }

  return derivationPath
}

const convertToHexString = (n: string): string => {
  if (n.startsWith('0x')) return n
  return `0x${n}`
}

export function makeBigIntLike(
  n: BigNumberish | undefined | null
): BigIntLike | undefined {
  let _n = n
  if (_n == null) return undefined
  if (isString(_n)) {
    _n = convertToHexString(_n)
  }
  return ('0x' + BigInt(_n).toString(16)) as BigIntLike
}

export function convertTxData(txData: TransactionRequest): LegacyTxData {
  return {
    to: txData.to?.toString() as AddressLike,
    nonce: makeBigIntLike(txData.nonce),
    gasPrice: makeBigIntLike(txData.gasPrice),
    gasLimit: makeBigIntLike(txData.gasLimit),
    value: makeBigIntLike(txData.value),
    data: txData.data as BytesLike,
    type: makeBigIntLike(txData.type)
  }
}

export const handleLedgerError = ({
  error,
  appType,
  network
}: {
  error: Error
  appType?: LedgerAppType
  network?: Network
}): void => {
  const ledgerAppName = appType ?? getLedgerAppName(network)

  const message = error.message.toLowerCase()
  if (message.includes(LEDGER_ERROR_CODES.WRONG_APP)) {
    throw new Error(
      `Wrong app open. Please open the ${ledgerAppName} app on your Ledger device.`
    )
  } else if (
    message.includes(LEDGER_ERROR_CODES.REJECTED) ||
    message.includes(LEDGER_ERROR_CODES.REJECTED_ALT)
  ) {
    throw new Error('Transaction rejected by user on Ledger device.')
  } else if (
    message.includes(LEDGER_ERROR_CODES.NOT_READY) ||
    message.includes(LEDGER_ERROR_CODES.COMMUNICATION_ERROR)
  ) {
    throw new Error(
      `${ledgerAppName} app not ready. Please ensure the ${ledgerAppName} app is open and ready.`
    )
  } else if (message.includes(LEDGER_ERROR_CODES.DEVICE_LOCKED)) {
    throw new Error(
      'Your Ledger device is locked. Please unlock it to continue.'
    )
  } else if (message.includes(LEDGER_ERROR_CODES.UPDATE_REQUIRED)) {
    throw new Error(
      `Update required. Please update the ${ledgerAppName} app on your Ledger device to continue.`
    )
  } else if (message.includes(LEDGER_ERROR_CODES.USER_CANCELLED)) {
    // User cancelled, no need to show alert
    return
  } else if (message.includes(LEDGER_ERROR_CODES.DISCONNECTED_DEVICE)) {
    throw new Error(
      'Ledger device disconnected. Please ensure your Ledger device is nearby and Bluetooth is enabled.'
    )
  } else if (
    message.includes(LEDGER_ERROR_CODES.TRANSPORT_RACE_CONDITION) ||
    message.includes(LEDGER_ERROR_CODES.TRANSPORT_RACE_CONDITION_ALT)
  ) {
    throw new Error(
      'Ledger is processing another request. Please try again later.'
    )
  } else if (
    message.includes(LEDGER_ERROR_CODES.BLIND_SIGN_REQUIRED) &&
    ledgerAppName === LedgerAppType.AVALANCHE
  ) {
    throw new Error(LEDGER_BLIND_SIGN_MESSAGE)
  } else if (message.includes(LEDGER_ERROR_CODES.BLIND_SIGNATURE)) {
    throw new Error(
      `This transaction cannot be clear-signed. Please enable blind signing in the Ledger ${ledgerAppName} app settings and try again.`
    )
  }
}
