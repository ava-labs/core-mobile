import { RpcMethod } from '@avalabs/vm-module-types'

// The vm-module RpcMethod enum enumerates exactly the approval/signing methods
// across all VMs (no read-only members). It is the single source of truth that
// replaces the per-provider hand-maintained signing lists. CP-14421.
const APPROVAL_METHODS = new Set<string>(Object.values(RpcMethod))

// Namespace-scoped: a cross-namespace enum member (solana_*, bitcoin_*, hvm_*)
// must NOT route into the EVM or AVAX signing path of an injected provider that
// doesn't own it — the prefix filter is mandatory, not cosmetic.
//
// `Set.has` is inherently prototype-safe: `toString`, `constructor`, `__proto__`
// etc. are not enum members, so they correctly classify as non-signing. This
// preserves the property the old `hasOwnProperty` check on the SIGNING_METHODS
// record provided.
// Returns a type guard: a true result proves `method` is an `RpcMethod` value
// (membership in APPROVAL_METHODS == Object.values(RpcMethod)), so callers narrow
// `method` to `RpcMethod` and avoid downstream `as RpcMethod` assertions.
const signingMethodMatcher =
  (...prefixes: string[]) =>
  (method: string): method is RpcMethod =>
    APPROVAL_METHODS.has(method) && prefixes.some(p => method.startsWith(p))

export const isEvmSigningMethod = signingMethodMatcher('eth_', 'personal_')

export const isAvalancheSigningMethod = signingMethodMatcher('avalanche_')
