import {
  Avalanche,
  BitcoinProvider,
  isSolanaProvider,
  JsonRpcBatchInternal
} from '@avalabs/core-wallets-sdk'
import {
  PubKeyType,
  SignTransactionRequest,
  WalletType
} from 'services/wallet/types'
import NetworkService from 'services/network/NetworkService'
import { Network } from '@avalabs/core-chains-sdk'
import SentryWrapper from 'services/sentry/SentryWrapper'
import Logger from 'utils/Logger'
import {
  MessageTypes,
  NetworkVMType,
  RpcMethod,
  TypedData,
  TypedDataV1,
  DerivationPathType
} from '@avalabs/vm-module-types'
import { Transaction } from 'ethers'
import {
  recoverPersonalSignature,
  recoverTypedSignature,
  SignTypedDataVersion
} from '@metamask/eth-sig-util'
import { isTypedData } from '@avalabs/evm-module'
import { SentryTag, SpanName } from 'services/sentry/types'
import { Curve } from 'utils/publicKeys'
import { GetAddressesResponse } from 'utils/api/generated/profileApi.client/types.gen'
import { postV1GetAddresses } from 'utils/api/generated/profileApi.client'
import { profileApiClient } from 'utils/api/clients/profileApiClient'
import {
  getAddressDerivationPath,
  hasActiveDerivedAddresses,
  isAvalancheTransactionRequest,
  isBtcTransactionRequest,
  isSolanaTransactionRequest
} from './utils'
import WalletFactory from './WalletFactory'
import { MnemonicWallet } from './MnemonicWallet'
import KeystoneWallet from './KeystoneWallet'
import { LedgerWallet } from './LedgerWallet'
import {
  getAddressesCache,
  setAddressesCache,
  getInFlightAddressesFetch,
  setInFlightAddressesFetch,
  clearInFlightAddressesFetch,
  getAddressesCacheEpoch
} from './getAddressesCache'

// Retry helper. Local to WalletService — promote to utils/ only if a second
// caller appears. Backoff: 250 / 500 / 1000 ms (3 retries, 4 total attempts).
// Treat network errors and HTTP 5xx as transient; everything else is fatal
// on the first try. Note: retry attempts are logged via Logger.info, which
// is console-only — they do NOT surface to Sentry in production.
const NETWORK_ERROR_PATTERN =
  /network request failed|timeout|timed out|aborted|fetch failed|socket hang up|econn|enotfound|getaddrinfo/i

const isTransientHttpError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') {
    return false
  }
  // Explicit non-retryable marker wins over every other heuristic.
  if ((err as { nonRetryable?: boolean }).nonRetryable === true) {
    return false
  }
  const statusRaw = (err as { status?: unknown }).status
  if (typeof statusRaw === 'number') {
    return statusRaw >= 500 && statusRaw < 600
  }
  // No numeric status. Only treat as transient if it looks like a
  // fetch/network error — TypeError from RN's fetch, or a message that
  // matches a known network-failure pattern. Everything else (validation,
  // JSON parse, programmer error) fails fast.
  if (err instanceof TypeError) {
    return true
  }
  const name = (err as { name?: unknown }).name
  if (
    name === 'FetchError' ||
    name === 'AbortError' ||
    name === 'TimeoutError'
  ) {
    return true
  }
  const message = (err as { message?: unknown }).message
  return typeof message === 'string' && NETWORK_ERROR_PATTERN.test(message)
}

const RETRY_DELAYS_MS = [250, 500, 1000] as const

const retryWithBackoff = async <T,>(
  attempt: () => Promise<T>,
  isTransient: (err: unknown) => boolean,
  delays: readonly number[]
): Promise<T> => {
  let lastErr: unknown
  for (let i = 0; i <= delays.length; i++) {
    try {
      return await attempt()
    } catch (err) {
      lastErr = err
      if (i === delays.length || !isTransient(err)) {
        throw err
      }
      Logger.info(
        `[WalletService.retryWithBackoff] attempt ${
          i + 1
        } failed, retrying in ${delays[i]}ms: ${String(err)}`
      )
      await new Promise(r => setTimeout(r, delays[i]))
    }
  }
  // Unreachable, but satisfies TS.
  throw lastErr
}

const EVM_SIGN_METHODS = new Set([
  RpcMethod.ETH_SIGN,
  RpcMethod.PERSONAL_SIGN,
  RpcMethod.SIGN_TYPED_DATA,
  RpcMethod.SIGN_TYPED_DATA_V1,
  RpcMethod.SIGN_TYPED_DATA_V3,
  RpcMethod.SIGN_TYPED_DATA_V4
])

const isEvmSignMethod = (method: RpcMethod): boolean =>
  EVM_SIGN_METHODS.has(method)

// Defense-in-depth: recover the signer from the produced signature and confirm it
// matches the address the approval prompt referred to, so a signed EVM tx/message
// can never come from a different key than was displayed (CP-14468).
const assertEvmTransactionSigner = (
  signedTx: string,
  expectedAddress: string
): void => {
  const recovered = Transaction.from(signedTx).from
  if (!recovered || recovered.toLowerCase() !== expectedAddress.toLowerCase()) {
    throw new Error(
      `EVM transaction signer mismatch: recovered=${
        recovered ?? 'unknown'
      }, expected=${expectedAddress}`
    )
  }
}

const assertEvmMessageSigner = ({
  signature,
  rpcMethod,
  data,
  expectedAddress
}: {
  signature: string
  rpcMethod: RpcMethod
  data: string | TypedDataV1 | TypedData<MessageTypes>
  expectedAddress: string
}): void => {
  let recovered: string

  if (
    rpcMethod === RpcMethod.ETH_SIGN ||
    rpcMethod === RpcMethod.PERSONAL_SIGN
  ) {
    recovered = recoverPersonalSignature({ data: data as string, signature })
  } else {
    const version =
      rpcMethod === RpcMethod.SIGN_TYPED_DATA_V3
        ? SignTypedDataVersion.V3
        : rpcMethod === RpcMethod.SIGN_TYPED_DATA_V4
        ? SignTypedDataVersion.V4
        : isTypedData(data)
        ? SignTypedDataVersion.V4
        : SignTypedDataVersion.V1

    recovered = recoverTypedSignature({
      data: data as TypedData<MessageTypes>,
      signature,
      version
    })
  }

  if (recovered.toLowerCase() !== expectedAddress.toLowerCase()) {
    throw new Error(
      `EVM message signer mismatch: recovered=${recovered}, expected=${expectedAddress}`
    )
  }
}

class WalletService {
  public async sign({
    walletId,
    walletType,
    transaction,
    accountIndex,
    accountName,
    network,
    sentrySpanName = 'sign-transaction',
    fromAddress
  }: {
    walletId: string
    walletType: WalletType
    transaction: SignTransactionRequest
    accountIndex: number
    accountName?: string
    network: Network
    sentrySpanName?: SpanName
    fromAddress?: string
  }): Promise<string> {
    return SentryWrapper.startSpan(
      { name: sentrySpanName, contextName: 'svc.wallet.sign' },
      async () => {
        const provider = await NetworkService.getProviderForNetwork(network)
        const wallet = await WalletFactory.createWallet({
          walletId,
          walletType
        })

        if (isBtcTransactionRequest(transaction)) {
          if (!(provider instanceof BitcoinProvider))
            throw new Error(
              'Unable to sign btc transaction: wrong provider obtained'
            )

          return wallet.signBtcTransaction({
            accountName, // show this account name for btc signing on ledger
            accountIndex,
            transaction,
            network,
            provider
          })
        }

        if (isAvalancheTransactionRequest(transaction)) {
          if (!(provider instanceof Avalanche.JsonRpcProvider))
            throw new Error(
              'Unable to sign avalanche transaction: wrong provider obtained'
            )

          return wallet.signAvalancheTransaction({
            accountIndex,
            transaction,
            network,
            provider
          })
        }

        if (isSolanaTransactionRequest(transaction)) {
          if (!isSolanaProvider(provider))
            throw new Error(
              'Unable to sign solana transaction: wrong provider obtained'
            )

          return wallet.signSvmTransaction({
            accountIndex,
            transaction,
            network,
            provider
          })
        }

        if (!(provider instanceof JsonRpcBatchInternal))
          throw new Error(
            'Unable to sign evm transaction: wrong provider obtained'
          )

        const signedEvmTx = await wallet.signEvmTransaction({
          accountIndex,
          transaction,
          network,
          provider
        })

        if (fromAddress) {
          assertEvmTransactionSigner(signedEvmTx, fromAddress)
        }

        return signedEvmTx
      }
    )
  }

  public async signMessage({
    walletId,
    walletType,
    rpcMethod,
    data,
    accountIndex,
    network,
    fromAddress
  }: {
    walletId: string
    walletType: WalletType
    rpcMethod: RpcMethod
    data: string | TypedDataV1 | TypedData<MessageTypes>
    accountIndex: number
    network: Network
    fromAddress?: string
  }): Promise<string> {
    const provider = await NetworkService.getProviderForNetwork(network)

    if (
      !(provider instanceof JsonRpcBatchInternal) &&
      !(provider instanceof Avalanche.JsonRpcProvider) &&
      !isSolanaProvider(provider)
    )
      throw new Error('Unable to sign message: wrong provider obtained')

    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    const signature = await wallet.signMessage({
      rpcMethod,
      data,
      accountIndex,
      network,
      provider
    })

    if (fromAddress && isEvmSignMethod(rpcMethod)) {
      assertEvmMessageSigner({
        signature,
        rpcMethod,
        data,
        expectedAddress: fromAddress
      })
    }

    return signature
  }

  //FIXME: call terminate for seedless
  // public async destroy(): Promise<void> {
  //   await WalletInitializer.terminate(this.walletType).catch(e =>
  //     Logger.error('unable to destroy wallet', e)
  //   )
  //   this.walletType = WalletType.UNSET
  // }

  /**
   * Get the public key of an account
   * @param account Account to get public key of.
   */
  public async getPublicKey(
    walletId: string,
    walletType: WalletType,
    accountIndex: number
  ): Promise<PubKeyType> {
    const derivationPathType: DerivationPathType | undefined =
      walletType !== WalletType.LEDGER && walletType !== WalletType.LEDGER_LIVE
        ? undefined
        : walletType === WalletType.LEDGER
        ? 'bip44'
        : 'ledger_live'
    const derivationPathEVM = getAddressDerivationPath({
      accountIndex,
      vmType: NetworkVMType.EVM,
      derivationPathType
    })
    const derivationPathAVM = getAddressDerivationPath({
      accountIndex,
      vmType: NetworkVMType.AVM,
      derivationPathType
    })

    // Check cache first for both keys
    const cachedEvmKey = WalletFactory.cache.getPublicKey(
      walletId,
      derivationPathEVM,
      Curve.SECP256K1
    )
    const cachedXpKey = WalletFactory.cache.getPublicKey(
      walletId,
      derivationPathAVM,
      Curve.SECP256K1
    )

    // If both are cached, return immediately
    if (cachedEvmKey && cachedXpKey) {
      return {
        evm: cachedEvmKey,
        xp: cachedXpKey
      }
    }

    // Otherwise, create wallet and derive missing keys
    const wallet = await WalletFactory.getOrCreateWallet({
      walletId,
      walletType
    })

    const evmPublicKey =
      cachedEvmKey ||
      (await wallet.getPublicKeyFor({
        derivationPath: derivationPathEVM,
        curve: Curve.SECP256K1
      }))

    const xpPublicKey =
      cachedXpKey ||
      (await wallet.getPublicKeyFor({
        derivationPath: derivationPathAVM,
        curve: Curve.SECP256K1
      }))

    // Cache any newly derived keys
    if (!cachedEvmKey) {
      WalletFactory.cache.setPublicKey(
        walletId,
        derivationPathEVM,
        Curve.SECP256K1,
        evmPublicKey
      )
    }
    if (!cachedXpKey) {
      WalletFactory.cache.setPublicKey(
        walletId,
        derivationPathAVM,
        Curve.SECP256K1,
        xpPublicKey
      )
    }

    return {
      evm: evmPublicKey,
      xp: xpPublicKey
    }
  }

  public async getPublicKeyFor({
    walletId,
    walletType,
    derivationPath,
    curve
  }: {
    walletId: string
    walletType: WalletType
    derivationPath?: string
    curve: Curve
  }): Promise<string> {
    // Check cache first
    // If derivation path is not provided, we use a default key
    // This supports wallets that don't use derivation paths (e.g. PrivateKeyWallet)
    const cacheKey = derivationPath ?? 'ROOT'

    const cached = WalletFactory.cache.getPublicKey(walletId, cacheKey, curve)
    if (cached) {
      return cached
    }

    const wallet = await WalletFactory.getOrCreateWallet({
      walletId,
      walletType
    })

    const publicKey = await wallet.getPublicKeyFor({
      derivationPath,
      curve
    })

    // Cache the result
    WalletFactory.cache.setPublicKey(walletId, cacheKey, curve, publicKey)

    return publicKey
  }

  public async getRawXpubXP({
    walletId,
    walletType,
    accountIndex
  }: {
    walletId: string
    walletType: WalletType
    accountIndex: number
  }): Promise<string> {
    if (!this.hasXpub(walletType)) {
      throw new Error('Unable to get raw xpub XP: unsupported wallet type')
    }

    // Check cache first
    const cached = WalletFactory.cache.getXpub(walletId, accountIndex)
    if (cached) {
      return cached
    }

    const wallet = await WalletFactory.getOrCreateWallet({
      walletId,
      walletType
    })

    if (
      !(wallet instanceof MnemonicWallet) &&
      !(wallet instanceof KeystoneWallet) &&
      !(wallet instanceof LedgerWallet)
    ) {
      throw new Error(
        'Unable to get raw xpub XP: Expected MnemonicWallet, KeystoneWallet or LedgerWallet instance'
      )
    }

    const xpub = await wallet.getRawXpubXP(accountIndex)

    // Cache the result
    WalletFactory.cache.setXpub(walletId, accountIndex, xpub)

    return xpub
  }

  public async getAddressesFromXpubXP({
    walletId,
    walletType,
    accountIndex,
    networkType,
    isTestnet = false,
    onlyWithActivity
  }: {
    walletId: string
    walletType: WalletType
    accountIndex: number
    networkType: NetworkVMType.AVM | NetworkVMType.PVM
    isTestnet: boolean
    onlyWithActivity: boolean
  }): Promise<GetAddressesResponse> {
    const xpubXP = await this.getRawXpubXP({
      walletId,
      walletType,
      accountIndex
    })

    return this.getAddressesForExtendedPublicKey({
      extendedPublicKey: xpubXP,
      networkType,
      isTestnet,
      onlyWithActivity
    })
  }

  public async hasActivityFromXpubXP({
    walletId,
    walletType,
    accountIndex,
    isTestnet = false
  }: {
    walletId: string
    walletType: WalletType
    accountIndex: number
    isTestnet?: boolean
  }): Promise<boolean> {
    if (!this.hasXpub(walletType)) {
      return false
    }

    // Keystone currently exposes an XP xpub only for account 0.
    // Skip non-primary accounts until the SDK supports per-account XP xpubs.
    // See: https://ava-labs.atlassian.net/browse/CP-12615
    if (walletType === WalletType.KEYSTONE && accountIndex > 0) {
      return false
    }

    const xpubXP = await this.getRawXpubXP({
      walletId,
      walletType,
      accountIndex
    })

    const checks = [
      this.getAddressesForExtendedPublicKey({
        extendedPublicKey: xpubXP,
        networkType: NetworkVMType.AVM,
        isTestnet,
        onlyWithActivity: true
      }).then(hasActiveDerivedAddresses),
      this.getAddressesForExtendedPublicKey({
        extendedPublicKey: xpubXP,
        networkType: NetworkVMType.PVM,
        isTestnet,
        onlyWithActivity: true
      }).then(hasActiveDerivedAddresses)
    ]

    return raceAnyTrueOrThrow(checks)
  }

  private async getAddressesForExtendedPublicKey({
    extendedPublicKey,
    networkType,
    isTestnet,
    onlyWithActivity
  }: {
    extendedPublicKey: string
    networkType: NetworkVMType.AVM | NetworkVMType.PVM
    isTestnet: boolean
    onlyWithActivity: boolean
  }): Promise<GetAddressesResponse> {
    const cacheKey = {
      extendedPublicKey,
      networkType,
      isTestnet,
      onlyWithActivity
    }
    const cached = getAddressesCache(cacheKey)
    if (cached) {
      return cached
    }

    const inFlight = getInFlightAddressesFetch(cacheKey)
    if (inFlight) {
      return inFlight
    }

    const startEpoch = getAddressesCacheEpoch()

    const fetchPromise = (async () => {
      try {
        const body = await retryWithBackoff(
          () => callPostV1GetAddressesOnce(cacheKey),
          isTransientHttpError,
          RETRY_DELAYS_MS
        )
        if (getAddressesCacheEpoch() === startEpoch) {
          setAddressesCache(cacheKey, body)
        }
        return body
      } catch (err) {
        Logger.error(
          '[WalletService.ts][getAddressesForExtendedPublicKey] failed',
          err,
          { source: SentryTag.ProfileApi }
        )
        throw err
      }
    })()

    setInFlightAddressesFetch(cacheKey, fetchPromise)

    // Compare-and-delete only the entry that still points at THIS promise, so
    // a clear-then-new-fetch interleaving can't have our stale settle wipe a
    // newer registration. The trailing `.catch(() => {})` swallows the chained
    // promise's rejection so it isn't reported as unhandled — callers get the
    // original `fetchPromise` for actual error propagation.
    fetchPromise
      .finally(() => clearInFlightAddressesFetch(cacheKey, fetchPromise))
      .catch(() => undefined)

    return fetchPromise
  }

  public async getPrivateKeyFromMnemonic(
    mnemonic: string,
    network: Network,
    accountIndex: number
  ): Promise<string> {
    const wallet: MnemonicWallet = new MnemonicWallet(mnemonic)
    const provider = await NetworkService.getProviderForNetwork(network)
    if (!(provider instanceof JsonRpcBatchInternal)) {
      throw new Error('Unable to get signing key: wrong provider obtained')
    }
    const buffer = await wallet.getSigningKey({
      accountIndex,
      network,
      provider
    })
    return '0x' + buffer.toString('hex')
  }

  public hasXpub(walletType: WalletType): boolean {
    return [
      WalletType.MNEMONIC,
      WalletType.KEYSTONE,
      WalletType.LEDGER
    ].includes(walletType)
  }
}

/**
 * @hey-api client returns either `{ data }` (responseStyle: 'fields', default)
 * or the parsed JSON body directly (responseStyle: 'data').
 */
const unwrapPostV1GetAddressesResult = (raw: unknown): unknown => {
  if (
    raw &&
    typeof raw === 'object' &&
    'data' in raw &&
    (raw as { data: unknown }).data !== undefined
  ) {
    return (raw as { data: unknown }).data
  }
  return raw
}

const isGetAddressesResponseBody = (
  value: unknown
): value is GetAddressesResponse =>
  typeof value === 'object' &&
  value !== null &&
  'networkType' in value &&
  Array.isArray((value as GetAddressesResponse).externalAddresses) &&
  Array.isArray((value as GetAddressesResponse).internalAddresses)

/**
 * One call to postV1GetAddresses + envelope/error normalization. Extracted
 * to module scope so `getAddressesForExtendedPublicKey` stays under the
 * cognitive-complexity ceiling.
 */
const callPostV1GetAddressesOnce = async ({
  extendedPublicKey,
  networkType,
  isTestnet,
  onlyWithActivity
}: {
  extendedPublicKey: string
  networkType: NetworkVMType.AVM | NetworkVMType.PVM
  isTestnet: boolean
  onlyWithActivity: boolean
}): Promise<GetAddressesResponse> => {
  const raw = await postV1GetAddresses({
    client: profileApiClient,
    body: {
      networkType,
      extendedPublicKey,
      isTestnet,
      onlyWithActivity
    }
  })

  // If hey-api gave us a structured error envelope, surface it as a
  // throw so the retry helper sees it. The status field is what
  // `isTransientHttpError` keys on. Only treat as a failure when `error`
  // is actually populated (not null/undefined) AND no `data` came back —
  // a `{ error: null }` or `{ data: ..., error: null }` shape would
  // otherwise mask a real success.
  if (raw && typeof raw === 'object') {
    const errField = (raw as { error?: unknown }).error
    const dataField = (raw as { data?: unknown }).data
    if (errField != null && dataField === undefined) {
      const err = errField as { status?: number; message?: string }
      const message = err?.message ?? 'profile-api returned an error envelope'
      const wrapped = new Error(
        `postV1GetAddresses failed (status=${
          err?.status ?? 'unknown'
        }): ${message}`
      )
      // Attach status so retry helper can categorize.
      ;(wrapped as Error & { status?: number }).status = err?.status
      throw wrapped
    }
  }

  const body = unwrapPostV1GetAddressesResult(raw)

  if (!isGetAddressesResponseBody(body)) {
    const shapeErr = new Error(
      `postV1GetAddresses returned an unrecognized body shape: ${
        typeof body === 'object'
          ? JSON.stringify(body).slice(0, 200)
          : String(body)
      }`
    )
    // Deterministic upstream contract violation — retrying won't help.
    ;(shapeErr as Error & { nonRetryable?: boolean }).nonRetryable = true
    throw shapeErr
  }

  return body
}

/**
 * Races boolean promises, returning true as soon as any resolves true.
 * Unlike the previous resolveAnyTrue, rejections are NOT swallowed —
 * if no promise resolves true and at least one rejected, the first
 * rejection is re-thrown so callers can treat the result as 'unknown'.
 */
const raceAnyTrueOrThrow = async (
  checks: Promise<boolean>[]
): Promise<boolean> => {
  if (checks.length === 0) {
    return false
  }

  type SettledResult = {
    index: number
    value: boolean
    error?: unknown
  }

  const wrappedChecks = checks.map((check, index) =>
    check
      .then(value => ({ index, value }))
      .catch((error: unknown) => ({ index, value: false, error }))
  )

  const remaining = new Set(wrappedChecks.map((_, index) => index))
  let firstError: unknown

  while (remaining.size > 0) {
    const result: SettledResult = await Promise.race(
      [...remaining].map(
        index => wrappedChecks[index] as Promise<SettledResult>
      )
    )

    remaining.delete(result.index)

    if (result.value) {
      return true
    }

    if (result.error !== undefined && firstError === undefined) {
      firstError = result.error
    }
  }

  if (firstError !== undefined) {
    throw firstError
  }

  return false
}

// Keep as singleton
export default new WalletService()
