import { FeatureGates } from 'services/posthog/types'
import { WalletType } from 'services/wallet/types'
import { RootState } from 'store/types'
import {
  selectIsSeedlessSigningBlocked,
  selectIsLegacyBridgeEnabled,
  selectIsFusionEnabled
} from './slice'
import { DefaultFeatureFlagConfig } from './types'

const createMockRootState = (overrides: {
  walletType?: WalletType
  featureFlags?: Partial<typeof DefaultFeatureFlagConfig>
}): RootState => {
  const { walletType = WalletType.MNEMONIC, featureFlags = {} } = overrides

  return {
    app: {
      walletType
    },
    posthog: {
      featureFlags: {
        ...DefaultFeatureFlagConfig,
        ...featureFlags
      }
    }
  } as RootState
}

describe('selectIsSeedlessSigningBlocked', () => {
  it('should return false for non-seedless wallets regardless of flags', () => {
    const state = createMockRootState({
      walletType: WalletType.MNEMONIC,
      featureFlags: {
        [FeatureGates.SEEDLESS_SIGNING]: false
      }
    })
    expect(selectIsSeedlessSigningBlocked(state)).toBe(false)
  })

  it('should return false for seedless wallet when signing is enabled', () => {
    const state = createMockRootState({
      walletType: WalletType.SEEDLESS,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.SEEDLESS_SIGNING]: true
      }
    })
    expect(selectIsSeedlessSigningBlocked(state)).toBe(false)
  })

  it('should return true for seedless wallet when SEEDLESS_SIGNING is off', () => {
    const state = createMockRootState({
      walletType: WalletType.SEEDLESS,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.SEEDLESS_SIGNING]: false
      }
    })
    expect(selectIsSeedlessSigningBlocked(state)).toBe(true)
  })

  it('should return true for seedless wallet when EVERYTHING is off', () => {
    const state = createMockRootState({
      walletType: WalletType.SEEDLESS,
      featureFlags: {
        [FeatureGates.EVERYTHING]: false,
        [FeatureGates.SEEDLESS_SIGNING]: true
      }
    })
    expect(selectIsSeedlessSigningBlocked(state)).toBe(true)
  })
})

describe('selectIsLegacyBridgeEnabled', () => {
  it('should return true when flag is on and wallet is non-seedless', () => {
    const state = createMockRootState({
      walletType: WalletType.MNEMONIC,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.LEGACY_BRIDGE]: true
      }
    })
    expect(selectIsLegacyBridgeEnabled(state)).toBe(true)
  })

  it('should return false when LEGACY_BRIDGE is off', () => {
    const state = createMockRootState({
      walletType: WalletType.MNEMONIC,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.LEGACY_BRIDGE]: false
      }
    })
    expect(selectIsLegacyBridgeEnabled(state)).toBe(false)
  })

  it('should return false when EVERYTHING is off', () => {
    const state = createMockRootState({
      walletType: WalletType.MNEMONIC,
      featureFlags: {
        [FeatureGates.EVERYTHING]: false,
        [FeatureGates.LEGACY_BRIDGE]: true
      }
    })
    expect(selectIsLegacyBridgeEnabled(state)).toBe(false)
  })

  it('should return false for seedless wallet when seedless signing is blocked', () => {
    const state = createMockRootState({
      walletType: WalletType.SEEDLESS,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.SEEDLESS_SIGNING]: false,
        [FeatureGates.LEGACY_BRIDGE]: true
      }
    })
    expect(selectIsLegacyBridgeEnabled(state)).toBe(false)
  })

  it('should return true for seedless wallet when seedless signing is enabled and flag is on', () => {
    const state = createMockRootState({
      walletType: WalletType.SEEDLESS,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.SEEDLESS_SIGNING]: true,
        [FeatureGates.LEGACY_BRIDGE]: true
      }
    })
    expect(selectIsLegacyBridgeEnabled(state)).toBe(true)
  })

  it('should return false for seedless wallet when seedless signing is enabled but flag is off', () => {
    const state = createMockRootState({
      walletType: WalletType.SEEDLESS,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.SEEDLESS_SIGNING]: true,
        [FeatureGates.LEGACY_BRIDGE]: false
      }
    })
    expect(selectIsLegacyBridgeEnabled(state)).toBe(false)
  })
})

describe('selectIsFusionEnabled', () => {
  it('should return true when flag is on and wallet is non-seedless', () => {
    const state = createMockRootState({
      walletType: WalletType.MNEMONIC,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.FUSION]: true
      }
    })
    expect(selectIsFusionEnabled(state)).toBe(true)
  })

  it('should return false when FUSION is off', () => {
    const state = createMockRootState({
      walletType: WalletType.MNEMONIC,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.FUSION]: false
      }
    })
    expect(selectIsFusionEnabled(state)).toBe(false)
  })

  it('should return false when EVERYTHING is off', () => {
    const state = createMockRootState({
      walletType: WalletType.MNEMONIC,
      featureFlags: {
        [FeatureGates.EVERYTHING]: false,
        [FeatureGates.FUSION]: true
      }
    })
    expect(selectIsFusionEnabled(state)).toBe(false)
  })

  it('should return false for seedless wallet when seedless signing is blocked', () => {
    const state = createMockRootState({
      walletType: WalletType.SEEDLESS,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.SEEDLESS_SIGNING]: false,
        [FeatureGates.FUSION]: true
      }
    })
    expect(selectIsFusionEnabled(state)).toBe(false)
  })

  it('should return true for seedless wallet when seedless signing is enabled and flag is on', () => {
    const state = createMockRootState({
      walletType: WalletType.SEEDLESS,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.SEEDLESS_SIGNING]: true,
        [FeatureGates.FUSION]: true
      }
    })
    expect(selectIsFusionEnabled(state)).toBe(true)
  })

  it('should return false for seedless wallet when seedless signing is enabled but flag is off', () => {
    const state = createMockRootState({
      walletType: WalletType.SEEDLESS,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.SEEDLESS_SIGNING]: true,
        [FeatureGates.FUSION]: false
      }
    })
    expect(selectIsFusionEnabled(state)).toBe(false)
  })
})
