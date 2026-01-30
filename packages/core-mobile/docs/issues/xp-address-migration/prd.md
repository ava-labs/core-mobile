# PRD: Missing XP Chain Addresses Issue

## Overview

### Problem Statement
Users are experiencing missing `addressAVM`, `addressPVM`, and `xpAddresses` data after app updates, preventing them from:
- Claiming staking rewards
- Viewing X-Chain and P-Chain addresses in account management
- Seeing correct balances on X/P chains

### Affected Users
- **Wallet types**: Mnemonic and Seedless wallets
- **Account indices**: Both primary (index 0) and additional accounts
- **Install types**: Both upgrades and fresh installs
- **Versions**: First reported in 1.0.18, persists through 1.0.19 and 1.0.20

### Business Impact
- Users unable to access staking functionality
- Support tickets increasing
- User trust affected by invisible assets

---

## Technical Analysis

### Root Cause
Multiple silent failure paths in address derivation:

1. **`ModuleManager.deriveAddresses`** uses `Promise.allSettled` and silently ignores failed module derivations
2. **Cascade effect**: Empty `addressAVM` propagates to empty `xpAddresses` array
3. **Migration dependency**: Migration 22 relies on runtime listener to populate addresses, which can fail silently
4. **Seedless-specific**: Missing or unparseable Avalanche public keys cause empty results

### Affected Code Paths
| File | Issue |
|------|-------|
| `app/vmModule/ModuleManager.ts` | Silent `Promise.allSettled` failures |
| `app/store/account/listeners.ts` | `populateXpAddressesForWallet` marks complete even on failure |
| `app/utils/getAddressesFromXpubXP/getAddressesFromXpubXP.ts` | Returns empty result without logging |
| `app/services/account/AccountsService.tsx` | No validation for empty addresses |

---

## Requirements

### Functional Requirements

#### FR-1: Debugging Capability
- Add dev menu options to inject broken account states for testing
- Add comprehensive logging throughout address derivation pipeline
- Enable reproduction of all known failure scenarios

#### FR-2: Fix Existing Affected Users
- Create migration 26 to detect accounts with empty/missing XP addresses
- Reset `hasMigratedXpAddresses` flag to force re-derivation
- Preserve existing data while attempting recovery

#### FR-3: Prevent Future Occurrences
- Log all address derivation failures (not just silently ignore)
- Validate addresses are non-empty before marking migration complete
- Add warnings/errors for empty AVM/PVM addresses

### Non-Functional Requirements

#### NFR-1: Backward Compatibility
- Migration must not corrupt existing valid data
- Users with working addresses should be unaffected

#### NFR-2: Observability
- All failures must be logged to Sentry
- Migration execution must be trackable

#### NFR-3: Performance
- Migration should not significantly impact app startup time
- Address re-derivation should happen in background

---

## Success Criteria

1. **Reproduction**: Can reliably reproduce all known failure scenarios via dev menu
2. **Recovery**: Affected users recover their XP addresses on app update
3. **Prevention**: No new users experience empty XP addresses
4. **Monitoring**: All address derivation failures are visible in Sentry

---

## Implementation Phases

### Phase 1: Debugging & Logging
- Add diagnostic logging to address derivation pipeline
- Create dev menu debug options for state injection
- Duration: ~2 days

### Phase 2: Migration Fix
- Implement migration 26 to reset affected accounts
- Enhance `populateXpAddressesForWallet` to validate before marking complete
- Duration: ~1 day

### Phase 3: Prevention
- Add validation in `ModuleManager.deriveAddresses`
- Add validation in `AccountsService.createNextAccount`
- Duration: ~1 day

### Phase 4: Testing & Validation
- Manual testing with all injected scenarios
- Unit tests for migration and validation logic
- Duration: ~1 day

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration corrupts valid data | High | Only modify accounts with `hasMigratedXpAddresses: true` AND empty addresses |
| Re-derivation fails again | Medium | Keep `hasMigratedXpAddresses: false` so retry happens on next unlock |
| Performance regression | Low | Migration is O(n) accounts, logging is minimal |

---

## Appendix

### Related Files
- `app/vmModule/ModuleManager.ts:119-148`
- `app/store/account/listeners.ts:282-470`
- `app/store/migrations.ts:396-457`
- `app/services/account/AccountsService.tsx:200-311`
- `app/utils/getAddressesFromXpubXP/getAddressesFromXpubXP.ts`

### Version History
| Date | Version | Change |
|------|---------|--------|
| 1.0.18 | Initial | Issue first reported |
| 1.0.19 | Change | Added `hasMigratedXpAddresses` per-account tracking |
| 1.0.20 | No change | Issue persists |
