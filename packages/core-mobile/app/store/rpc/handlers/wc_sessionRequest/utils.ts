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

export const isVerifiedCoreDomain = (
  verifyContext: VerifyContext | undefined
): boolean => {
  if (!verifyContext) return false

  const { validation, origin } = verifyContext.verified

  try {
    const urlObj = new URL(origin)
    if (urlObj.protocol === 'chrome-extension:') {
      // INVALID means the browser's actual origin didn't match the claimed chrome-extension URL.
      // UNKNOWN is expected for the real Core Extension (chrome-extension:// can't host the WC verify frame).
      return (
        validation !== 'INVALID' && CORE_EXT_HOSTNAMES.includes(urlObj.hostname)
      )
    }
  } catch {
    return false
  }

  // UNKNOWN = domain not registered with WC Verify (or Verify API unavailable).
  // INVALID = origin does not match registered domain — likely spoofed.
  if (validation !== 'VALID') {
    return false
  }

  return isCoreDomain(origin)
}

/**
 * Returns the URL that should be scanned by Blockaid for malicious-site
 * detection.
 *
 * `proposer.metadata.url` is self-declared by the dApp and therefore
 * spoofable: a malicious peer can claim `metadata.url = "https://core.app"`
 * (or any benign site) while actually being served from an attacker origin,
 * which would blind the scan. WalletConnect's Verify API exposes the origin it
 * actually observed on `verifyContext.verified.origin`, so we prefer that
 * attested origin whenever it is present and only fall back to the self-declared
 * metadata URL when Verify is unavailable (empty origin).
 */
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
  walletConnectCache.sessionProposalParams.set(params)
  router.navigate('/authorizeDapp')
}

export const isSiteScanResponseMalicious = (
  scanResponse: SiteScanResponse
): boolean => scanResponse.status === 'hit' && scanResponse.is_malicious

/**
 * How much we trust that the identity shown to the user (name / url / icon)
 * genuinely belongs to the domain the connection actually came from.
 *
 * MALICIOUS  - a definitive scam verdict (WC scam registry or Blockaid).
 * SUSPICIOUS - the displayed identity could not be reconciled with the origin
 *              WalletConnect actually observed (spoofing signal).
 * UNVERIFIED - we were unable to run our checks (e.g. scan unavailable).
 * TRUSTED    - no negative signals.
 */
export enum DappTrustLevel {
  MALICIOUS = 'MALICIOUS',
  SUSPICIOUS = 'SUSPICIOUS',
  UNVERIFIED = 'UNVERIFIED',
  TRUSTED = 'TRUSTED'
}

export type DappTrustAssessment = {
  level: DappTrustLevel
  /** Human-readable reasons behind the verdict (first is the most severe). */
  reasons: string[]
  /**
   * The URL that should actually be shown to the user as the dApp's identity.
   * Prefers the origin WalletConnect attested; only falls back to the
   * spoofable self-declared metadata URL when Verify provides no origin.
   */
  displayUrl: string
  /**
   * True when `displayUrl` is the origin WalletConnect actually observed.
   * False when it is the self-declared metadata URL (unverified fallback) —
   * the UI should mark it as unverified in that case.
   */
  originAttested: boolean
  /** metadata.url's host neither equals nor is a sub/parent of the attested host. */
  originMismatch: boolean
}

const getHostname = (url: string): string | undefined => {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return undefined
  }
}

// Two hosts belong to the same site when they are equal or one is a subdomain
// of the other (e.g. "uniswap.org" vs "app.uniswap.org"). This keeps legitimate
// apex/subdomain splits from being flagged while still catching a metadata URL
// that points at a completely different domain than the attested origin.
const isSameSite = (a: string, b: string): boolean =>
  a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`)

/**
 * Folds every available signal — WalletConnect Verify (attested origin,
 * validation state, scam flag) and the Blockaid site scan — into a single
 * verdict about whether the dApp's self-declared identity can be trusted.
 *
 * The self-declared `proposer.metadata` (name/url/icons) is fully
 * attacker-controlled, so it is never trusted on its own: we reconcile it
 * against `verifyContext.verified.origin`, the origin WalletConnect actually
 * observed, and surface any mismatch to the user.
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

  // Always surface a URL — hiding it hurts legitimate unverified dApps. The UI
  // distinguishes a VALID-attested origin (shown with a verified badge) from a
  // self-reported, unverified URL (shown with a "could not be verified"
  // warning). Under non-VALID states `origin` is just the echoed self-declared
  // metadata, so we display metadataUrl there. `originAttested` tells the UI
  // which treatment to apply — the URL is never presented as trusted unless
  // VALID-attested.
  const displayUrl = isOriginVerified ? attestedOrigin : metadataUrl

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
    originMismatch
  })

  // --- MALICIOUS: definitive scam verdicts -------------------------------
  const maliciousReasons: string[] = []
  if (isScam) {
    maliciousReasons.push('WalletConnect has flagged this dApp as a known scam.')
  }
  if (scanResponse && isSiteScanResponseMalicious(scanResponse)) {
    maliciousReasons.push('This application has been flagged as malicious.')
  }
  if (maliciousReasons.length > 0) {
    return make(DappTrustLevel.MALICIOUS, maliciousReasons)
  }

  // --- SUSPICIOUS: WC detected the real origin ≠ the claimed domain -------
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

  // --- UNVERIFIED: identity is not VALID-attested ------------------------
  // Any dApp without a VALID Verify attestation is unverified: its name/URL are
  // self-reported and could be impersonating another site (this is the common
  // case for dApps not registered with WC Verify, and the exact hole the
  // metadata-spoof relied on). We refuse to present the claimed identity and
  // surface the connection as unverified.
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
