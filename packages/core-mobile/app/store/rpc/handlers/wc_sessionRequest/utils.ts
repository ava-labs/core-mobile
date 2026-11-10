import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { Networks } from 'store/network/types'
import {
  CORE_EVM_METHODS,
  CORE_AVAX_METHODS,
  CORE_BTC_METHODS,
  RpcMethod,
  CORE_WALLET_METHODS
} from 'store/rpc/types'
import { z } from 'zod'
import { WCSessionProposal } from 'store/walletConnectV2/types'
import Logger from 'utils/Logger'
import SentryService from 'services/sentry/SentryService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { isDebugOrInternalBuild } from 'utils/Utils'
import BlockaidService from 'services/blockaid/BlockaidService'
import { SiteScanResponse } from 'services/blockaid/types'
import { ProposalTypes } from '@walletconnect/types'
import {
  isXChainId,
  isCChainId,
  isPChainId,
  isBtcChainId,
  isSvmChainId
} from 'utils/caip2ChainIds'
import { router } from 'expo-router'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { SessionProposalV2Params } from '../types'

const CORE_WEB_HOSTNAMES = [
  'core.app',
  'staging.core.app',
  'develop.core.app',
  'ava-labs.github.io' // internal playground
]

/**
 * Core - Browser Extension ids
 * When parsed with URL(...), the browser ID is recognized as "hostname".
 * For example, this:
 *   new URL('chrome-extension://agoakfejjabomempkjlepdflaleeobhb/popup.html#/home')
 * results in:
 *   URL({ hostname: 'agoakfejjabomempkjlepdflaleeobhb', ... })
 */
const CORE_EXT_HOSTNAMES = [
  'agoakfejjabomempkjlepdflaleeobhb', // production build
  'dnoiacbfkodekgkjbpoagaljpbhaedmd' // blue build
]

const CORE_WEB_HOSTNAME_REGEXES = [
  // core web preview deploys (ex. d0ce77c0-core-web-dev.avalabs.workers.dev)
  /^[a-zA-Z0-9]+-core-web-dev\.avalabs\.workers\.dev$/
]

export const isCoreMethod = (method: string): boolean =>
  [
    ...CORE_EVM_METHODS,
    ...CORE_AVAX_METHODS,
    ...CORE_BTC_METHODS,
    ...CORE_WALLET_METHODS
  ].includes(method as RpcMethod)

export const isLocalhost = (url: string): boolean => {
  try {
    const { hostname, protocol } = new URL(url)
    return (
      (hostname === 'localhost' || hostname === '127.0.0.1') &&
      (protocol === 'http:' || protocol === 'https:')
    )
  } catch {
    return false
  }
}

export const isCoreWebDomain = (url: string): boolean => {
  try {
    const { hostname, protocol } = new URL(url)
    return (
      protocol === 'https:' &&
      (CORE_WEB_HOSTNAMES.includes(hostname) ||
        CORE_WEB_HOSTNAME_REGEXES.some(regex => regex.test(hostname)))
    )
  } catch {
    return false
  }
}

export const isCoreDomain = (url: string): boolean => {
  let hostname = ''
  let protocol = ''

  try {
    const urlObj = new URL(url)
    hostname = urlObj.hostname
    protocol = urlObj.protocol
  } catch (e) {
    return false
  }

  const isCoreExt =
    CORE_EXT_HOSTNAMES.includes(hostname) && protocol === 'chrome-extension:'

  return isLocalhost(url) || isCoreWebDomain(url) || isCoreExt
}

export type VerifyContext = WCSessionProposal['data']['verifyContext']

const isCoreWebPreviewHost = (url: string): boolean => {
  try {
    const { hostname, protocol } = new URL(url)
    return (
      protocol === 'https:' &&
      CORE_WEB_HOSTNAME_REGEXES.some(regex => regex.test(hostname))
    )
  } catch {
    return false
  }
}

// Origins Verify can never attest: local dev servers and hashed preview deploys.
const isUnverifiableFirstPartyDevOrigin = (origin: string): boolean =>
  isLocalhost(origin) || isCoreWebPreviewHost(origin)

const reportedDevOriginOverrides = new Set<string>()

const reportDevOriginOverride = (origin: string): void => {
  if (reportedDevOriginOverrides.has(origin)) return
  reportedDevOriginOverrides.add(origin)
  const message = `[dev-origin-override] treating unverified ${origin} as a Core domain`
  Logger.warn(message)
  try {
    SentryService.captureMessage(
      message,
      { origin },
      { source: 'dev-origin-override' },
      undefined,
      'warning'
    )
  } catch {
    // telemetry must never change the trust decision
  }
}

export const isVerifiedCoreDomain = (
  verifyContext: VerifyContext | undefined
): boolean => {
  if (!verifyContext) return false

  const { validation, origin } = verifyContext.verified

  // Widens trust on internal builds (which already run the debug AppCheck
  // provider) for Core Web local/preview testing; spoofable under UNKNOWN.
  if (
    validation !== 'INVALID' &&
    isUnverifiableFirstPartyDevOrigin(origin) &&
    isDebugOrInternalBuild()
  ) {
    reportDevOriginOverride(origin)
    return true
  }

  // UNKNOWN = domain not registered with WC Verify (or Verify API unavailable).
  // INVALID = origin does not match registered domain, likely spoofed.
  // chrome-extension:// origins can never be VALID (no verify frame), so they
  // fall through to false here; see getExtensionImportMethods for the narrow
  // capability they do get.
  if (validation !== 'VALID') {
    return false
  }

  // isCoreDomain also accepts extension ids, but a VALID chrome-extension
  // origin is never legitimate, so exclude the protocol explicitly.
  try {
    if (new URL(origin).protocol === 'chrome-extension:') return false
  } catch {
    return false
  }

  return isCoreDomain(origin)
}

const EXTENSION_IMPORT_METHODS: readonly RpcMethod[] = [
  RpcMethod.AVALANCHE_GET_ACCOUNTS,
  RpcMethod.AVALANCHE_GET_ACCOUNT_PUB_KEY
]

/**
 * The Core extension cannot host the Verify frame, so its identity is always
 * self-reported. Its one legitimate use (import account from Core Mobile) needs
 * exactly these two read methods; grant those and never the verified treatment.
 */
export const getExtensionImportMethods = (
  verifyContext: VerifyContext | undefined
): RpcMethod[] => {
  if (!verifyContext) return []
  const { validation, origin } = verifyContext.verified
  if (validation === 'INVALID') return []
  try {
    const { protocol, hostname } = new URL(origin)
    if (protocol !== 'chrome-extension:') return []
    if (!CORE_EXT_HOSTNAMES.includes(hostname)) return []
  } catch {
    return []
  }
  return [...EXTENSION_IMPORT_METHODS]
}

/** Strip Core methods for non-Core peers except `allowed`. */
export const stripCoreMethods = <
  T extends Record<string, { methods?: string[] }>
>(
  namespaces: T,
  allowed: readonly string[]
): T => {
  const out = {} as T
  for (const key of Object.keys(namespaces) as (keyof T)[]) {
    const ns = namespaces[key] as T[keyof T]
    out[key] = {
      ...ns,
      methods: (ns.methods ?? []).filter(
        m => !isCoreMethod(m) || allowed.includes(m)
      )
    }
  }
  return out
}

/** Scan the attested origin, not the spoofable metadata.url. */
export const getScanUrl = (
  verifyContext: VerifyContext | undefined,
  metadataUrl: string
): string => {
  const attestedOrigin = verifyContext?.verified.origin
  return attestedOrigin && attestedOrigin.trim().length > 0
    ? attestedOrigin
    : metadataUrl
}

export const isNetworkSupported = (
  supportedNetworks: Networks,
  caip2ChainId: string
): boolean => {
  const chainId = caip2ChainId.split(':')[1] ?? ''
  const network = supportedNetworks[Number(chainId)]
  if (network) {
    return [NetworkVMType.EVM].includes(network.vmName)
  }

  return (
    isXChainId(caip2ChainId) ||
    isPChainId(caip2ChainId) ||
    isCChainId(caip2ChainId) ||
    isBtcChainId(caip2ChainId) ||
    isSvmChainId(caip2ChainId)
  )
}

export type CoreAccountAddresses = z.infer<typeof coreAccountAddresses>

export const getAddressForChainId = (
  caip2ChainId: string,
  account: CoreAccountAddresses
): string | undefined => {
  return isXChainId(caip2ChainId)
    ? account.addressAVM
    : isPChainId(caip2ChainId)
    ? account.addressPVM
    : isBtcChainId(caip2ChainId)
    ? account.addressBTC
    : isSvmChainId(caip2ChainId)
    ? account.addressSVM
    : account.addressC
}

const coreAccountAddresses = z.object({
  addressC: z.string(),
  addressBTC: z.string(),
  addressAVM: z.string().optional(),
  addressPVM: z.string().optional(),
  addressCoreEth: z.string(),
  addressSVM: z.string().optional()
})

const namespaceToApproveSchema = z.object({
  chains: z.array(z.string()).optional(),
  methods: z.array(z.string()),
  events: z.array(z.string())
})

export type NamespaceToApprove = z.infer<typeof namespaceToApproveSchema>

const approveDataSchema = z.object({
  selectedAccounts: z.array(coreAccountAddresses).nonempty(),
  namespaces: z.record(z.string(), namespaceToApproveSchema)
})

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const parseApproveData = (data: unknown) => {
  return approveDataSchema.safeParse(data)
}

export const scanAndNavigateToSessionProposal = async ({
  dappUrl,
  request,
  namespaces
}: {
  dappUrl: string
  request: WCSessionProposal
  namespaces: Record<string, ProposalTypes.RequiredNamespace>
}): Promise<void> => {
  try {
    const scanResponse = await BlockaidService.scanSite(dappUrl)
    navigateToSessionProposal({ request, namespaces, scanResponse })
  } catch (error) {
    Logger.error('[Blockaid] Failed to scan dApp', error)
    navigateToSessionProposal({ request, namespaces, scanFailed: true })
  }
}

export const navigateToSessionProposal = (
  params: SessionProposalV2Params
): void => {
  captureSessionProposalTrust(params)
  walletConnectCache.sessionProposalParams.set(params)
  router.navigate('/authorizeDapp')
}

export const isSiteScanResponseMalicious = (
  scanResponse: SiteScanResponse
): boolean => scanResponse.status === 'hit' && scanResponse.is_malicious

/** Whether the dApp's displayed identity belongs to the connecting origin. */
export enum DappTrustLevel {
  /** WC scam registry or Blockaid verdict. */
  MALICIOUS = 'MALICIOUS',
  /** Displayed identity contradicts the observed origin. */
  SUSPICIOUS = 'SUSPICIOUS',
  /** Not VALID-attested, or the scan was unavailable. */
  UNVERIFIED = 'UNVERIFIED',
  TRUSTED = 'TRUSTED'
}

export type DappTrustAssessment = {
  level: DappTrustLevel
  reasons: string[]
  /** Attested origin when VALID, else metadata.url. */
  displayUrl: string
  /** False when displayUrl is self-reported; the UI marks it unverified. */
  originAttested: boolean
  originMismatch: boolean
  /** Attested origin even under INVALID; never displayed. */
  securityOrigin: string
}

const getHostname = (url: string): string | undefined => {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return undefined
  }
}

// Equal or subdomain; avoids flagging apex/sub splits.
const isSameSite = (a: string, b: string): boolean =>
  a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`)

// INVALID: use the attested origin (real observation); UNKNOWN: use
// metadata.url (origin is only an echo).
const getSecurityOrigin = ({
  attestedOrigin,
  validation,
  metadataUrl
}: {
  attestedOrigin: string
  validation: VerifyContext['verified']['validation'] | undefined
  metadataUrl: string
}): string => {
  if (attestedOrigin.length === 0) return metadataUrl
  if (validation === 'VALID' || validation === 'INVALID') return attestedOrigin
  return metadataUrl
}

/**
 * Folds WC Verify and the Blockaid scan into one trust verdict.
 * proposer.metadata is attacker-controlled.
 */
export const assessDappTrust = ({
  verifyContext,
  metadataUrl,
  scanResponse,
  scanFailed = false
}: {
  verifyContext: VerifyContext | undefined
  metadataUrl: string
  scanResponse?: SiteScanResponse
  scanFailed?: boolean
}): DappTrustAssessment => {
  const attestedOrigin = verifyContext?.verified.origin?.trim() ?? ''
  const validation = verifyContext?.verified.validation
  const isScam = verifyContext?.verified.isScam === true

  // CRITICAL: `origin` is only authenticated when validation === 'VALID'. Under
  // 'UNKNOWN' WalletConnect populates `origin` with the dApp's OWN, unverified,
  // attacker-controlled metadata.url (confirmed on-device: a non-browser dApp
  // claiming metadata.url = https://core.app arrives as
  // origin: 'https://core.app', validation: 'UNKNOWN'). So a non-VALID origin
  // must never be treated as identity — otherwise any dApp can masquerade as
  // Core / Uniswap / anything by just setting metadata.url.
  const isOriginVerified = validation === 'VALID' && attestedOrigin.length > 0

  // Always surface a URL; hiding it hurts legitimate unverified dApps.
  // `originAttested` tells the UI whether to present it as verified.
  const displayUrl = isOriginVerified ? attestedOrigin : metadataUrl
  const securityOrigin = getSecurityOrigin({
    attestedOrigin,
    validation,
    metadataUrl
  })

  const metadataHostname = getHostname(metadataUrl)
  const attestedHostname =
    attestedOrigin.length > 0 ? getHostname(attestedOrigin) : undefined
  // A mismatch is meaningful only when `origin` is a REAL observed origin that
  // differs from the claimed metadata — that only happens for a genuine browser
  // attestation (an echoed metadata origin would equal metadata and not
  // mismatch). It's a strong spoof signal even under UNKNOWN.
  const originMismatch =
    metadataHostname !== undefined &&
    attestedHostname !== undefined &&
    !isSameSite(metadataHostname, attestedHostname)

  const make = (
    level: DappTrustLevel,
    reasons: string[]
  ): DappTrustAssessment => ({
    level,
    reasons,
    displayUrl,
    originAttested: isOriginVerified,
    originMismatch,
    securityOrigin
  })

  const maliciousReasons: string[] = []
  if (isScam) {
    maliciousReasons.push(
      'WalletConnect has flagged this dApp as a known scam.'
    )
  }
  if (scanResponse && isSiteScanResponseMalicious(scanResponse)) {
    maliciousReasons.push('This application has been flagged as malicious.')
  }
  if (maliciousReasons.length > 0) {
    return make(DappTrustLevel.MALICIOUS, maliciousReasons)
  }

  const suspiciousReasons: string[] = []
  if (validation === 'INVALID') {
    suspiciousReasons.push(
      "This dApp's actual origin does not match the domain it claims to be — it may be impersonating another site."
    )
  }
  if (originMismatch) {
    suspiciousReasons.push(
      `This dApp claims to be "${metadataHostname}" but is served from "${attestedHostname}".`
    )
  }
  if (suspiciousReasons.length > 0) {
    return make(DappTrustLevel.SUSPICIOUS, suspiciousReasons)
  }

  // Any non-VALID dApp is unverified: name and URL are self-reported.
  const unverifiedReasons: string[] = []
  if (!isOriginVerified) {
    unverifiedReasons.push(
      "This dApp's identity could not be verified — its name and address are self-reported and may be impersonating another site. Connect only if you trust it."
    )
  }
  if (scanFailed) {
    unverifiedReasons.push(
      'Security scan unavailable. Proceed only if you trust this dApp.'
    )
  }
  if (unverifiedReasons.length > 0) {
    return make(DappTrustLevel.UNVERIFIED, unverifiedReasons)
  }

  return make(DappTrustLevel.TRUSTED, [])
}

// Measures how many dApps register with WalletConnect Verify.
const captureSessionProposalTrust = ({
  request,
  scanResponse,
  scanFailed
}: SessionProposalV2Params): void => {
  try {
    const { verifyContext } = request.data
    const trust = assessDappTrust({
      verifyContext,
      metadataUrl: request.data.params.proposer.metadata.url,
      scanResponse,
      scanFailed
    })
    AnalyticsService.capture('WalletConnectSessionProposalTrust', {
      validation: verifyContext?.verified.validation ?? 'NONE',
      isScam: verifyContext?.verified.isScam === true,
      trustLevel: trust.level,
      dAppHostname: getHostname(trust.displayUrl) ?? ''
    })
  } catch (error) {
    Logger.error('Failed to capture session proposal trust', error)
  }
}
