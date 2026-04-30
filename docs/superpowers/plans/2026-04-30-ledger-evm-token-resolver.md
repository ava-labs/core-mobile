# Ledger EVM Token Resolver Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Ledger swap failures on Aave Ethereum by querying Ledger's CAL API directly when the CDN/static bundle lacks ERC-20 token descriptors.

**Architecture:** A new `LedgerEvmTokenResolver` service queries `crypto-assets-service.api.ledger.com` for signed token descriptors, caches results in an LRU cache, and injects them into the Ledger resolution before signing. The approval screen prefetches descriptors in the background so they're cached before signing starts.

**Tech Stack:** TypeScript, React Native, Jest, Ledger hw-app-eth, ethers `Transaction`

**Spec:** `docs/superpowers/specs/2026-04-30-ledger-evm-token-resolver-design.md`

**Deferred from spec:**
- **Parallel resolution** (nice-to-have): This plan implements sequential fallback. Parallel can be added later if latency is an issue in practice.
- **User-facing blind signing warning UI**: The spec calls for a banner on the Ledger approval screen, but signing happens *after* the approval screen closes, so LedgerWallet has no UI access at that point. The plan logs warnings via `Logger.warn` for debugging. A user-facing error message when the Ledger device rejects a blind-sign transaction is handled by the existing error flow in `handleAppConnection`. A dedicated UI warning is deferred to a follow-up.

---

## File Structure

| File | Type | Responsibility |
|------|------|----------------|
| `app/services/ledger/LedgerEvmTokenResolver.ts` | New | CAL API client, descriptor builder, LRU cache, ERC-20 detection |
| `app/services/ledger/LedgerEvmTokenResolver.test.ts` | New | Unit tests for resolver |
| `app/services/wallet/LedgerWallet.ts` | Modified | Integrate resolver into `getEvmSignature` and `getCChainSignature` |
| `app/new/features/approval/screens/ApprovalScreen/ApprovalScreen.tsx` | Modified | Prefetch token descriptors for Ledger wallets |

All paths relative to `packages/core-mobile/`.

---

### Task 1: LedgerEvmTokenResolver — Descriptor Builder + Validation (TDD)

**Files:**
- Create: `app/services/ledger/LedgerEvmTokenResolver.test.ts`
- Create: `app/services/ledger/LedgerEvmTokenResolver.ts`

- [ ] **Step 1: Write failing tests for `buildDescriptor`**

Create `app/services/ledger/LedgerEvmTokenResolver.test.ts`:

```typescript
import Logger from 'utils/Logger'
import LedgerEvmTokenResolver from './LedgerEvmTokenResolver'

jest.spyOn(Logger, 'info').mockImplementation(jest.fn())
jest.spyOn(Logger, 'warn').mockImplementation(jest.fn())

describe('LedgerEvmTokenResolver', () => {
  describe('buildDescriptor', () => {
    it('builds descriptor from AAVE CAL API response', () => {
      // CAL API returns: ticker(4 bytes) + address(20) + decimals(4) + chainId(4) = 32 bytes
      // "AAVE" = 41415645, address = 7fc6...dae9, decimals = 00000012 (18), chainId = 00000001 (1)
      const data =
        '414156457fc66500c84a76ad7e9c93437bfc5ac33e2ddae90000001200000001'
      const signature =
        '304402204245fb63f748566f94a8edab39e33ed27d247ce2becaf77f5b994b25280d469b02202edb2751a47402df19d3e3f37cc2da10045698977f76f8aece49957233ff57f4'

      const result = LedgerEvmTokenResolver.buildDescriptor(data, signature)

      // Expected: tickerLength(1 byte "04") + data + signature
      expect(result).toBe('04' + data + signature)
    })

    it('builds descriptor for aEthDAI (7-char ticker)', () => {
      // "aEthDAI" = 61457468444149 (7 bytes)
      const data =
        '61457468444149018008bfb33d285247a21d44e50697654f754e630000001200000001'
      const signature = '3044022000aabbccdd'

      const result = LedgerEvmTokenResolver.buildDescriptor(data, signature)

      // tickerLength = (35 bytes total - 28 fixed) = 7 = "07"
      expect(result).toBe('07' + data + signature)
    })

    it('returns undefined for data shorter than 29 bytes', () => {
      // 28 bytes = address(20) + decimals(4) + chainId(4), no room for ticker
      const data = '7fc66500c84a76ad7e9c93437bfc5ac33e2ddae90000001200000001'
      const signature = '3044aabb'

      const result = LedgerEvmTokenResolver.buildDescriptor(data, signature)

      expect(result).toBeUndefined()
    })

    it('returns undefined for empty signature', () => {
      const data =
        '414156457fc66500c84a76ad7e9c93437bfc5ac33e2ddae90000001200000001'

      const result = LedgerEvmTokenResolver.buildDescriptor(data, '')

      expect(result).toBeUndefined()
    })

    it('returns undefined for ticker longer than 11 chars', () => {
      // 12-char ticker = data would be 12 + 28 = 40 bytes = 80 hex chars
      const fakeTicker = '414243444546474849504b4c' // 12 bytes
      const rest =
        '7fc66500c84a76ad7e9c93437bfc5ac33e2ddae90000001200000001'
      const data = fakeTicker + rest
      const signature = '3044aabb'

      const result = LedgerEvmTokenResolver.buildDescriptor(data, signature)

      expect(result).toBeUndefined()
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/core-mobile && yarn test app/services/ledger/LedgerEvmTokenResolver.test.ts`
Expected: FAIL — module `./LedgerEvmTokenResolver` not found

- [ ] **Step 3: Implement `buildDescriptor` and scaffold the class**

Create `app/services/ledger/LedgerEvmTokenResolver.ts`:

```typescript
import Logger from 'utils/Logger'

const CAL_SERVICE_URL = 'https://crypto-assets-service.api.ledger.com'

const CAL_API_TIMEOUT_MS = 3000

// address(20) + decimals(4) + chainId(4) = 28 bytes
const FIXED_FIELD_BYTES = 28
const MIN_TICKER_LENGTH = 1
const MAX_TICKER_LENGTH = 11
const MIN_DATA_BYTES = FIXED_FIELD_BYTES + MIN_TICKER_LENGTH // 29

const CHAIN_ID_TO_BLOCKCHAIN_NAME: Record<number, string> = {
  1: 'ethereum',
  43114: 'avalanche',
  56: 'bsc',
  137: 'polygon',
  42161: 'arbitrum',
  10: 'optimism',
  8453: 'base'
}

// ERC-20 function selectors for approve, transfer, transferFrom
const ERC20_SELECTORS = new Set([
  '095ea7b3', // approve(address,uint256)
  'a9059cbb', // transfer(address,uint256)
  '23b872dd'  // transferFrom(address,address,uint256)
])

const CACHE_MAX_ENTRIES = 100
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const NEGATIVE_CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

interface CacheEntry {
  descriptor: string | null // null = confirmed missing (negative cache)
  timestamp: number
}

class LedgerEvmTokenResolver {
  private static cache = new Map<string, CacheEntry>()

  /**
   * Build a device-compatible ERC-20 token descriptor from CAL API data.
   *
   * CAL API `data` format: [ticker: N bytes][address: 20 bytes][decimals: 4 bytes BE][chainId: 4 bytes BE]
   * Device format: [tickerLength: 1 byte][ticker][address][decimals][chainId][signature]
   *
   * Returns hex-encoded descriptor string, or undefined if validation fails.
   */
  static buildDescriptor(
    data: string,
    signature: string
  ): string | undefined {
    if (!signature) {
      Logger.warn('[LedgerEvmTokenResolver] Empty signature, skipping')
      return undefined
    }

    const dataBytes = data.length / 2
    if (dataBytes < MIN_DATA_BYTES) {
      Logger.warn(
        `[LedgerEvmTokenResolver] Data too short: ${dataBytes} bytes (min ${MIN_DATA_BYTES})`
      )
      return undefined
    }

    const tickerLength = dataBytes - FIXED_FIELD_BYTES
    if (tickerLength > MAX_TICKER_LENGTH) {
      Logger.warn(
        `[LedgerEvmTokenResolver] Ticker too long: ${tickerLength} chars (max ${MAX_TICKER_LENGTH})`
      )
      return undefined
    }

    const tickerLengthHex = tickerLength.toString(16).padStart(2, '0')
    return tickerLengthHex + data + signature
  }

  static clearCache(): void {
    this.cache.clear()
  }
}

export default LedgerEvmTokenResolver
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/core-mobile && yarn test app/services/ledger/LedgerEvmTokenResolver.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core-mobile/app/services/ledger/LedgerEvmTokenResolver.ts packages/core-mobile/app/services/ledger/LedgerEvmTokenResolver.test.ts
git commit -m "feat(ledger): add LedgerEvmTokenResolver descriptor builder with tests (CP-14113)"
```

---

### Task 2: LedgerEvmTokenResolver — ERC-20 Detection Helper (TDD)

**Files:**
- Modify: `app/services/ledger/LedgerEvmTokenResolver.test.ts`
- Modify: `app/services/ledger/LedgerEvmTokenResolver.ts`

- [ ] **Step 1: Write failing tests for `isErc20Transaction`**

Add to `LedgerEvmTokenResolver.test.ts` inside the main `describe` block:

```typescript
  describe('isErc20Transaction', () => {
    it('detects approve selector', () => {
      // approve(address,uint256) = 0x095ea7b3
      const txData = '095ea7b3' + '0'.repeat(128)
      expect(LedgerEvmTokenResolver.isErc20Transaction(txData)).toBe(true)
    })

    it('detects transfer selector', () => {
      // transfer(address,uint256) = 0xa9059cbb
      const txData = 'a9059cbb' + '0'.repeat(128)
      expect(LedgerEvmTokenResolver.isErc20Transaction(txData)).toBe(true)
    })

    it('detects transferFrom selector', () => {
      // transferFrom(address,address,uint256) = 0x23b872dd
      const txData = '23b872dd' + '0'.repeat(192)
      expect(LedgerEvmTokenResolver.isErc20Transaction(txData)).toBe(true)
    })

    it('returns false for non-ERC-20 selector', () => {
      const txData = 'deadbeef' + '0'.repeat(128)
      expect(LedgerEvmTokenResolver.isErc20Transaction(txData)).toBe(false)
    })

    it('returns false for data shorter than 4 bytes', () => {
      expect(LedgerEvmTokenResolver.isErc20Transaction('095ea7')).toBe(false)
    })

    it('returns false for empty data', () => {
      expect(LedgerEvmTokenResolver.isErc20Transaction('')).toBe(false)
    })

    it('handles data with 0x prefix', () => {
      const txData = '0x095ea7b3' + '0'.repeat(128)
      expect(LedgerEvmTokenResolver.isErc20Transaction(txData)).toBe(true)
    })
  })
```

- [ ] **Step 2: Run tests to verify the new tests fail**

Run: `cd packages/core-mobile && yarn test app/services/ledger/LedgerEvmTokenResolver.test.ts`
Expected: FAIL — `isErc20Transaction` is not a function

- [ ] **Step 3: Implement `isErc20Transaction`**

Add to `LedgerEvmTokenResolver.ts` class body:

```typescript
  /**
   * Check if a transaction's calldata starts with a known ERC-20 selector.
   * @param txData - hex-encoded transaction data (with or without 0x prefix)
   */
  static isErc20Transaction(txData: string): boolean {
    const data = txData.startsWith('0x') ? txData.slice(2) : txData
    if (data.length < 8) return false
    return ERC20_SELECTORS.has(data.substring(0, 8).toLowerCase())
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/core-mobile && yarn test app/services/ledger/LedgerEvmTokenResolver.test.ts`
Expected: All 12 tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core-mobile/app/services/ledger/LedgerEvmTokenResolver.ts packages/core-mobile/app/services/ledger/LedgerEvmTokenResolver.test.ts
git commit -m "feat(ledger): add ERC-20 transaction detection to LedgerEvmTokenResolver (CP-14113)"
```

---

### Task 3: LedgerEvmTokenResolver — CAL API Client, Cache, and `resolve()` (TDD)

**Files:**
- Modify: `app/services/ledger/LedgerEvmTokenResolver.test.ts`
- Modify: `app/services/ledger/LedgerEvmTokenResolver.ts`

- [ ] **Step 1: Write failing tests for `resolve()` and caching**

Add to `LedgerEvmTokenResolver.test.ts` inside the main `describe` block:

```typescript
  describe('resolve', () => {
    const AAVE_ADDRESS = '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'
    const AAVE_DATA =
      '414156457fc66500c84a76ad7e9c93437bfc5ac33e2ddae90000001200000001'
    const AAVE_SIGNATURE =
      '304402204245fb63f748566f94a8edab39e33ed27d247ce2becaf77f5b994b25280d469b02202edb2751a47402df19d3e3f37cc2da10045698977f76f8aece49957233ff57f4'

    beforeEach(() => {
      LedgerEvmTokenResolver.clearCache()
      global.fetch = jest.fn()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('resolves a known token from CAL API', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              descriptor: {
                data: AAVE_DATA,
                descriptorType: 'token',
                signatures: { prod: AAVE_SIGNATURE }
              }
            }
          ])
      })

      const result = await LedgerEvmTokenResolver.resolve(AAVE_ADDRESS, 1)

      expect(result).toBe('04' + AAVE_DATA + AAVE_SIGNATURE)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch.mock.calls[0]?.[0]).toContain(
        'crypto-assets-service.api.ledger.com/v1/tokens'
      )
      expect(mockFetch.mock.calls[0]?.[0]).toContain(
        'blockchain_name=ethereum'
      )
      expect(mockFetch.mock.calls[0]?.[0]).toContain(
        `contract_address=${AAVE_ADDRESS}`
      )
    })

    it('returns undefined for unknown token', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })

      const result = await LedgerEvmTokenResolver.resolve(
        '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
        1
      )

      expect(result).toBeUndefined()
    })

    it('returns undefined for unsupported chain ID', async () => {
      const result = await LedgerEvmTokenResolver.resolve(AAVE_ADDRESS, 999999)

      expect(result).toBeUndefined()
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('uses cache on second call', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              descriptor: {
                data: AAVE_DATA,
                descriptorType: 'token',
                signatures: { prod: AAVE_SIGNATURE }
              }
            }
          ])
      })

      const result1 = await LedgerEvmTokenResolver.resolve(AAVE_ADDRESS, 1)
      const result2 = await LedgerEvmTokenResolver.resolve(AAVE_ADDRESS, 1)

      expect(result1).toBe(result2)
      expect(mockFetch).toHaveBeenCalledTimes(1) // only 1 fetch, second was cached
    })

    it('negative-caches missing tokens', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })

      const result1 = await LedgerEvmTokenResolver.resolve(
        '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
        1
      )
      const result2 = await LedgerEvmTokenResolver.resolve(
        '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
        1
      )

      expect(result1).toBeUndefined()
      expect(result2).toBeUndefined()
      expect(mockFetch).toHaveBeenCalledTimes(1) // negative cached
    })

    it('returns undefined on network error', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await LedgerEvmTokenResolver.resolve(AAVE_ADDRESS, 1)

      expect(result).toBeUndefined()
    })

    it('returns undefined on non-ok response', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const result = await LedgerEvmTokenResolver.resolve(AAVE_ADDRESS, 1)

      expect(result).toBeUndefined()
    })

    it('returns undefined for malformed API response', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ unexpected: 'format' }])
      })

      const result = await LedgerEvmTokenResolver.resolve(AAVE_ADDRESS, 1)

      expect(result).toBeUndefined()
    })
  })

  describe('prefetch', () => {
    beforeEach(() => {
      LedgerEvmTokenResolver.clearCache()
      global.fetch = jest.fn()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('populates cache for subsequent resolve calls', async () => {
      const AAVE_ADDRESS = '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'
      const AAVE_DATA =
        '414156457fc66500c84a76ad7e9c93437bfc5ac33e2ddae90000001200000001'
      const AAVE_SIGNATURE = '3044aabbccdd'

      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              descriptor: {
                data: AAVE_DATA,
                descriptorType: 'token',
                signatures: { prod: AAVE_SIGNATURE }
              }
            }
          ])
      })

      // prefetch is fire-and-forget, but we need to wait for it
      LedgerEvmTokenResolver.prefetch(AAVE_ADDRESS, 1)

      // Wait for the background fetch to complete
      await new Promise(resolve => setTimeout(resolve, 50))

      // Now resolve should use cache
      const result = await LedgerEvmTokenResolver.resolve(AAVE_ADDRESS, 1)

      expect(result).toBe('04' + AAVE_DATA + AAVE_SIGNATURE)
      expect(mockFetch).toHaveBeenCalledTimes(1) // only the prefetch call
    })
  })
```

- [ ] **Step 2: Run tests to verify the new tests fail**

Run: `cd packages/core-mobile && yarn test app/services/ledger/LedgerEvmTokenResolver.test.ts`
Expected: FAIL — `resolve` and `prefetch` are not functions

- [ ] **Step 3: Implement `resolve()`, `prefetch()`, and cache logic**

Replace the full content of `app/services/ledger/LedgerEvmTokenResolver.ts`:

```typescript
import Logger from 'utils/Logger'

const CAL_SERVICE_URL = 'https://crypto-assets-service.api.ledger.com'

const CAL_API_TIMEOUT_MS = 3000

// address(20) + decimals(4) + chainId(4) = 28 bytes
const FIXED_FIELD_BYTES = 28
const MIN_TICKER_LENGTH = 1
const MAX_TICKER_LENGTH = 11
const MIN_DATA_BYTES = FIXED_FIELD_BYTES + MIN_TICKER_LENGTH // 29

const CHAIN_ID_TO_BLOCKCHAIN_NAME: Record<number, string> = {
  1: 'ethereum',
  43114: 'avalanche',
  56: 'bsc',
  137: 'polygon',
  42161: 'arbitrum',
  10: 'optimism',
  8453: 'base'
}

// ERC-20 function selectors for approve, transfer, transferFrom
const ERC20_SELECTORS = new Set([
  '095ea7b3', // approve(address,uint256)
  'a9059cbb', // transfer(address,uint256)
  '23b872dd'  // transferFrom(address,address,uint256)
])

const CACHE_MAX_ENTRIES = 100
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const NEGATIVE_CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

interface CacheEntry {
  descriptor: string | null // null = confirmed missing (negative cache)
  timestamp: number
}

class LedgerEvmTokenResolver {
  private static cache = new Map<string, CacheEntry>()

  /**
   * Build a device-compatible ERC-20 token descriptor from CAL API data.
   *
   * CAL API `data` format: [ticker: N bytes][address: 20 bytes][decimals: 4 bytes BE][chainId: 4 bytes BE]
   * Device format: [tickerLength: 1 byte][ticker][address][decimals][chainId][signature]
   *
   * Returns hex-encoded descriptor string, or undefined if validation fails.
   */
  static buildDescriptor(
    data: string,
    signature: string
  ): string | undefined {
    if (!signature) {
      Logger.warn('[LedgerEvmTokenResolver] Empty signature, skipping')
      return undefined
    }

    const dataBytes = data.length / 2
    if (dataBytes < MIN_DATA_BYTES) {
      Logger.warn(
        `[LedgerEvmTokenResolver] Data too short: ${dataBytes} bytes (min ${MIN_DATA_BYTES})`
      )
      return undefined
    }

    const tickerLength = dataBytes - FIXED_FIELD_BYTES
    if (tickerLength > MAX_TICKER_LENGTH) {
      Logger.warn(
        `[LedgerEvmTokenResolver] Ticker too long: ${tickerLength} chars (max ${MAX_TICKER_LENGTH})`
      )
      return undefined
    }

    const tickerLengthHex = tickerLength.toString(16).padStart(2, '0')
    return tickerLengthHex + data + signature
  }

  /**
   * Check if a transaction's calldata starts with a known ERC-20 selector.
   * @param txData - hex-encoded transaction data (with or without 0x prefix)
   */
  static isErc20Transaction(txData: string): boolean {
    const data = txData.startsWith('0x') ? txData.slice(2) : txData
    if (data.length < 8) return false
    return ERC20_SELECTORS.has(data.substring(0, 8).toLowerCase())
  }

  /**
   * Resolve a signed ERC-20 token descriptor from Ledger's CAL API.
   * Returns the hex-encoded descriptor string compatible with
   * provideERC20TokenInformation(), or undefined if not found.
   */
  static async resolve(
    contractAddress: string,
    chainId: number
  ): Promise<string | undefined> {
    const blockchainName = CHAIN_ID_TO_BLOCKCHAIN_NAME[chainId]
    if (!blockchainName) {
      Logger.info(
        `[LedgerEvmTokenResolver] Unsupported chain ID: ${chainId}`
      )
      return undefined
    }

    const cacheKey = `${chainId}:${contractAddress.toLowerCase()}`
    const cached = this.getCached(cacheKey)
    if (cached !== undefined) {
      return cached
    }

    try {
      const descriptor = await this.fetchFromCalApi(
        contractAddress,
        blockchainName
      )
      this.setCache(cacheKey, descriptor)
      return descriptor ?? undefined
    } catch (error) {
      Logger.warn(
        '[LedgerEvmTokenResolver] CAL API query failed',
        error
      )
      return undefined
    }
  }

  /**
   * Prefetch and cache a token descriptor. Fire-and-forget.
   * Called from the approval screen when tokenApprovals are available.
   */
  static prefetch(contractAddress: string, chainId: number): void {
    this.resolve(contractAddress, chainId).catch(() => {
      // fire-and-forget — errors are logged inside resolve()
    })
  }

  /**
   * Clear the in-memory cache. Useful for testing.
   */
  static clearCache(): void {
    this.cache.clear()
  }

  // -- Private helpers --

  private static getCached(cacheKey: string): string | null | undefined {
    const entry = this.cache.get(cacheKey)
    if (!entry) return undefined // not in cache

    const ttl =
      entry.descriptor === null ? NEGATIVE_CACHE_TTL_MS : CACHE_TTL_MS
    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(cacheKey)
      return undefined // expired
    }

    // Move to end for LRU ordering
    this.cache.delete(cacheKey)
    this.cache.set(cacheKey, entry)

    return entry.descriptor
  }

  private static setCache(
    cacheKey: string,
    descriptor: string | null
  ): void {
    // Evict oldest entries if at capacity
    while (this.cache.size >= CACHE_MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(cacheKey, { descriptor, timestamp: Date.now() })
  }

  private static async fetchFromCalApi(
    contractAddress: string,
    blockchainName: string
  ): Promise<string | null> {
    const params = new URLSearchParams({
      output:
        'id,blockchain_name,contract_address,ticker,decimals,chain_id,descriptor',
      blockchain_name: blockchainName,
      contract_address: contractAddress
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      CAL_API_TIMEOUT_MS
    )

    try {
      const response = await fetch(
        `${CAL_SERVICE_URL}/v1/tokens?${params}`,
        { signal: controller.signal }
      )

      if (!response.ok) {
        Logger.warn(
          `[LedgerEvmTokenResolver] CAL API returned ${response.status}`
        )
        return null
      }

      const data = await response.json()
      if (!Array.isArray(data) || data.length === 0) {
        return null
      }

      const token = data[0]
      const descriptor = token?.descriptor
      if (
        !descriptor?.data ||
        !descriptor?.signatures?.prod
      ) {
        Logger.warn(
          '[LedgerEvmTokenResolver] Malformed CAL API response'
        )
        return null
      }

      return (
        this.buildDescriptor(descriptor.data, descriptor.signatures.prod) ??
        null
      )
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

export default LedgerEvmTokenResolver
```

- [ ] **Step 4: Run tests to verify all pass**

Run: `cd packages/core-mobile && yarn test app/services/ledger/LedgerEvmTokenResolver.test.ts`
Expected: All 20 tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core-mobile/app/services/ledger/LedgerEvmTokenResolver.ts packages/core-mobile/app/services/ledger/LedgerEvmTokenResolver.test.ts
git commit -m "feat(ledger): implement CAL API client, LRU cache, and resolve() for EVM token resolution (CP-14113)"
```

---

### Task 4: Integrate Resolver into LedgerWallet — EVM Signing Path

**Files:**
- Modify: `app/services/wallet/LedgerWallet.ts:1528-1582`

- [ ] **Step 1: Add import for LedgerEvmTokenResolver and Transaction**

At the top of `app/services/wallet/LedgerWallet.ts`, add the import alongside existing ledger imports. The file already imports `Transaction` from `ethers` (line 34) and `Logger` from `utils/Logger` (line 53). Add:

```typescript
import LedgerEvmTokenResolver from 'services/ledger/LedgerEvmTokenResolver'
```

Note: Use the `services/` alias — the codebase uses module path aliases configured in `tsconfig.json`.
Check which alias resolves to `app/services/` (it may be just the relative path `../ledger/LedgerEvmTokenResolver` from the wallet directory). Match existing import patterns in the file.

- [ ] **Step 2: Modify `getEvmSignature` to use the resolver**

In `app/services/wallet/LedgerWallet.ts`, replace the `getEvmSignature` method (lines 1528-1582) with:

```typescript
  private getEvmSignature = async ({
    transport,
    derivationPath,
    unsignedTx
  }: {
    transport: TransportBLE
    derivationPath: string
    unsignedTx: string
  }): Promise<SignatureRSV> => {
    // Use Ethereum app for other EVM chains
    const ethApp = new Eth(transport as Transport)
    Logger.info('Created Ethereum app instance')

    // Verify we can get the correct address
    Logger.info('Getting address from Ledger')
    const addressResult = await ethApp.getAddress(derivationPath)
    Logger.info('Got address from Ledger:', addressResult.address)

    // Resolve transaction metadata for clear signing (NFTs, ERC-20s, plugins).
    // Without this, the Ledger device falls back to blind signing.
    let resolution
    try {
      resolution = await ledgerService.resolveTransaction(
        unsignedTx,
        {},
        { nft: true, erc20: true, externalPlugins: true }
      )
      Logger.info('Resolved transaction for clear signing:', resolution)
    } catch (error) {
      Logger.warn(
        'Failed to resolve transaction for clear signing, falling back to blind signing',
        error
      )
    }

    // Fallback: if resolveTransaction returned no ERC-20 token info for an ERC-20 tx,
    // query Ledger's CAL API directly (the CDN/static bundle may be stale).
    if (resolution && resolution.erc20Tokens.length === 0) {
      try {
        const parsed = Transaction.from('0x' + unsignedTx)
        if (
          parsed.to &&
          parsed.data &&
          LedgerEvmTokenResolver.isErc20Transaction(parsed.data)
        ) {
          const chainId = Number(parsed.chainId)
          const descriptor = await LedgerEvmTokenResolver.resolve(
            parsed.to,
            chainId
          )
          if (descriptor) {
            resolution.erc20Tokens.push(descriptor)
            Logger.info(
              `[LedgerEvmTokenResolver] Injected ERC-20 descriptor for ${parsed.to} on chain ${chainId}`
            )
          } else {
            Logger.warn(
              `[LedgerEvmTokenResolver] No descriptor found for ${parsed.to} on chain ${chainId}, proceeding with blind signing`
            )
          }
        }
      } catch (error) {
        Logger.warn(
          '[LedgerEvmTokenResolver] Failed to resolve ERC-20 token via CAL API',
          error
        )
      }
    }

    // Sign with Ethereum app
    Logger.info('Signing transaction with Ethereum app')
    const result = await ethApp.signTransaction(
      derivationPath,
      unsignedTx,
      resolution ?? null
    )

    if (!result) {
      throw new Error('signTransaction returned undefined')
    }

    const signature = {
      r: result.r,
      s: result.s,
      v: result.v
    }
    Logger.info('Got signature from Ethereum app:', signature)
    return signature
  }
```

- [ ] **Step 3: Run type checking**

Run: `cd packages/core-mobile && yarn tsc --noEmit`
Expected: No type errors related to LedgerWallet.ts

- [ ] **Step 4: Commit**

```bash
git add packages/core-mobile/app/services/wallet/LedgerWallet.ts
git commit -m "feat(ledger): integrate EVM token resolver into getEvmSignature (CP-14113)"
```

---

### Task 5: Integrate Resolver into LedgerWallet — C-Chain Signing Path

**Files:**
- Modify: `app/services/wallet/LedgerWallet.ts:1470-1526`

- [ ] **Step 1: Modify `getCChainSignature` to use the resolver**

In `app/services/wallet/LedgerWallet.ts`, replace the `getCChainSignature` method (lines 1470-1526) with:

```typescript
  private getCChainSignature = async ({
    transport,
    derivationPath,
    unsignedTx
  }: {
    transport: TransportBLE
    derivationPath: string
    unsignedTx: string
  }): Promise<SignatureRSV> => {
    // Use Avalanche app for Avalanche C-Chain
    const avaxApp = new AppAvax(transport as Transport)
    Logger.info('Created Avalanche app instance')

    // Verify we can get the correct address
    Logger.info('Getting address from Ledger')
    const addressResult = await avaxApp.getETHAddress(derivationPath)
    Logger.info('Got address from Ledger:', addressResult.address)

    // Resolve transaction metadata for clear signing (NFTs, ERC-20s, plugins).
    // Without this, the Ledger device falls back to blind signing.
    let resolution
    try {
      resolution = await ledgerService.resolveTransaction(
        unsignedTx,
        {},
        { nft: true, erc20: true, externalPlugins: true }
      )
      Logger.info('Resolved C-Chain transaction for clear signing:', resolution)
    } catch (error) {
      Logger.warn(
        'Failed to resolve C-Chain transaction, using empty resolution',
        error
      )
      resolution = {
        externalPlugin: [],
        erc20Tokens: [],
        nfts: [],
        plugin: [],
        domains: []
      }
    }

    // Fallback: if resolveTransaction returned no ERC-20 token info for an ERC-20 tx,
    // query Ledger's CAL API directly (the CDN/static bundle may be stale).
    if (resolution.erc20Tokens.length === 0) {
      try {
        const parsed = Transaction.from('0x' + unsignedTx)
        if (
          parsed.to &&
          parsed.data &&
          LedgerEvmTokenResolver.isErc20Transaction(parsed.data)
        ) {
          const chainId = Number(parsed.chainId)
          const descriptor = await LedgerEvmTokenResolver.resolve(
            parsed.to,
            chainId
          )
          if (descriptor) {
            resolution.erc20Tokens.push(descriptor)
            Logger.info(
              `[LedgerEvmTokenResolver] Injected ERC-20 descriptor for ${parsed.to} on chain ${chainId}`
            )
          } else {
            Logger.warn(
              `[LedgerEvmTokenResolver] No descriptor found for ${parsed.to} on chain ${chainId}, proceeding with blind signing`
            )
          }
        }
      } catch (error) {
        Logger.warn(
          '[LedgerEvmTokenResolver] Failed to resolve ERC-20 token via CAL API',
          error
        )
      }
    }

    // Sign with Avalanche app
    Logger.info('Signing transaction with Avalanche app')
    const signature = await avaxApp.signEVMTransaction(
      derivationPath,
      unsignedTx,
      resolution
    )

    if (!signature) {
      throw new Error('signEVMTransaction returned undefined')
    }

    Logger.info('Got signature from Avalanche app:', signature)
    return signature
  }
```

- [ ] **Step 2: Run type checking**

Run: `cd packages/core-mobile && yarn tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Run existing LedgerWallet tests**

Run: `cd packages/core-mobile && yarn test app/services/wallet/LedgerWallet.test.ts`
Expected: All existing tests still PASS. The resolver call is behind a condition (`erc20Tokens.length === 0` AND `isErc20Transaction`) so existing mocked flows should be unaffected.

If any tests fail, add a mock for the new import at the top of the test file:

```typescript
jest.mock('services/ledger/LedgerEvmTokenResolver', () => ({
  __esModule: true,
  default: {
    resolve: jest.fn().mockResolvedValue(undefined),
    isErc20Transaction: jest.fn().mockReturnValue(false),
    prefetch: jest.fn(),
    clearCache: jest.fn()
  }
}))
```

- [ ] **Step 4: Commit**

```bash
git add packages/core-mobile/app/services/wallet/LedgerWallet.ts
git commit -m "feat(ledger): integrate EVM token resolver into getCChainSignature (CP-14113)"
```

---

### Task 6: Add Prefetch to ApprovalScreen

**Files:**
- Modify: `app/new/features/approval/screens/ApprovalScreen/ApprovalScreen.tsx`

- [ ] **Step 1: Add import for LedgerEvmTokenResolver and useEffect**

In `app/new/features/approval/screens/ApprovalScreen/ApprovalScreen.tsx`, add the import near the top with other service imports:

```typescript
import LedgerEvmTokenResolver from 'services/ledger/LedgerEvmTokenResolver'
```

Verify `useEffect` is already imported from React (it likely is — check the existing React imports at the top of the file).

- [ ] **Step 2: Add prefetch useEffect**

Inside the `ApprovalScreen` component, after the existing `isLedger` and `chainId` declarations (around line 60), add:

```typescript
  // Prefetch ERC-20 token descriptors for Ledger wallets so they're
  // cached by the time the user approves and signing begins.
  useEffect(() => {
    if (!isLedger || !chainId || !displayData.tokenApprovals?.approvals) {
      return
    }

    for (const approval of displayData.tokenApprovals.approvals) {
      if (approval.token?.address) {
        LedgerEvmTokenResolver.prefetch(approval.token.address, chainId)
      }
    }
  }, [isLedger, chainId, displayData.tokenApprovals])
```

- [ ] **Step 3: Run type checking**

Run: `cd packages/core-mobile && yarn tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add packages/core-mobile/app/new/features/approval/screens/ApprovalScreen/ApprovalScreen.tsx
git commit -m "feat(ledger): prefetch ERC-20 token descriptors on approval screen for Ledger wallets (CP-14113)"
```

---

### Task 7: Run Full Test Suite and Lint

**Files:** None (verification only)

- [ ] **Step 1: Run all resolver tests**

Run: `cd packages/core-mobile && yarn test app/services/ledger/LedgerEvmTokenResolver.test.ts`
Expected: All tests PASS

- [ ] **Step 2: Run LedgerWallet tests**

Run: `cd packages/core-mobile && yarn test app/services/wallet/LedgerWallet.test.ts`
Expected: All existing tests PASS

- [ ] **Step 3: Run full type check**

Run: `cd packages/core-mobile && yarn tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Run linter**

Run: `cd packages/core-mobile && yarn lint`
Expected: No new lint errors. Fix any that appear in the new/modified files.

- [ ] **Step 5: Final commit (if lint fixes needed)**

```bash
git add -u
git commit -m "fix(ledger): lint fixes for EVM token resolver (CP-14113)"
```
