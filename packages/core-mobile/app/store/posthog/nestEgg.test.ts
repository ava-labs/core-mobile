import { FeatureGates } from 'services/posthog/types'
import { WalletType } from 'services/wallet/types'
import { initialState as nestEggInitialState } from 'store/nestEgg/slice'
import { RootState } from 'store/types'
import {
  selectIsNestEggCampaignBlocked,
  selectIsNestEggNewSeedlessOnly,
  selectIsNestEggCampaignActive,
  selectIsNestEggEligible
} from './slice'
import { DefaultFeatureFlagConfig } from './types'

const createMockRootState = (overrides: {
  walletType?: WalletType
  featureFlags?: Partial<typeof DefaultFeatureFlagConfig>
  coreAnalytics?: boolean | undefined | null
  nestEggState?: Partial<typeof nestEggInitialState>
}): RootState => {
  const {
    walletType = WalletType.SEEDLESS,
    featureFlags = {},
    nestEggState = {}
  } = overrides

  // Handle coreAnalytics separately to allow explicit undefined
  const coreAnalytics =
    'coreAnalytics' in overrides ? overrides.coreAnalytics : true

  return {
    app: {
      walletType
    },
    posthog: {
      featureFlags: {
        ...DefaultFeatureFlagConfig,
        ...featureFlags
      }
    },
    settings: {
      securityPrivacy: {
        coreAnalytics
      }
    },
    nestEgg: {
      ...nestEggInitialState,
      ...nestEggState
    }
  } as RootState
}

describe('Nest Egg PostHog selectors', () => {
  describe('selectIsNestEggCampaignBlocked', () => {
    it('should return true when both flags are OFF', () => {
      const state = createMockRootState({
        featureFlags: {
          [FeatureGates.EVERYTHING]: true,
          [FeatureGates.NEST_EGG_CAMPAIGN]: false,
          [FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY]: false
        }
      })
      expect(selectIsNestEggCampaignBlocked(state)).toBe(true)
    })

    it('should return false when NEST_EGG_CAMPAIGN is ON', () => {
      const state = createMockRootState({
        featureFlags: {
          [FeatureGates.EVERYTHING]: true,
          [FeatureGates.NEST_EGG_CAMPAIGN]: true,
          [FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY]: false
        }
      })
      expect(selectIsNestEggCampaignBlocked(state)).toBe(false)
    })

    it('should return false when NEST_EGG_NEW_SEEDLESS_ONLY is ON', () => {
      const state = createMockRootState({
        featureFlags: {
          [FeatureGates.EVERYTHING]: true,
          [FeatureGates.NEST_EGG_CAMPAIGN]: false,
          [FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY]: true
        }
      })
      expect(selectIsNestEggCampaignBlocked(state)).toBe(false)
    })

    it('should return true when EVERYTHING flag is OFF', () => {
      const state = createMockRootState({
        featureFlags: {
          [FeatureGates.EVERYTHING]: false,
          [FeatureGates.NEST_EGG_CAMPAIGN]: true,
          [FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY]: true
        }
      })
      expect(selectIsNestEggCampaignBlocked(state)).toBe(true)
    })
  })

  describe('selectIsNestEggNewSeedlessOnly', () => {
    it('should return true when NEST_EGG_NEW_SEEDLESS_ONLY is ON', () => {
      const state = createMockRootState({
        featureFlags: {
          [FeatureGates.EVERYTHING]: true,
          [FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY]: true
        }
      })
      expect(selectIsNestEggNewSeedlessOnly(state)).toBe(true)
    })

    it('should return false when NEST_EGG_NEW_SEEDLESS_ONLY is OFF', () => {
      const state = createMockRootState({
        featureFlags: {
          [FeatureGates.EVERYTHING]: true,
          [FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY]: false
        }
      })
      expect(selectIsNestEggNewSeedlessOnly(state)).toBe(false)
    })

    it('should return false when EVERYTHING is OFF', () => {
      const state = createMockRootState({
        featureFlags: {
          [FeatureGates.EVERYTHING]: false,
          [FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY]: true
        }
      })
      expect(selectIsNestEggNewSeedlessOnly(state)).toBe(false)
    })
  })

  describe('selectIsNestEggCampaignActive', () => {
    it('should return true when NEST_EGG_CAMPAIGN is ON', () => {
      const state = createMockRootState({
        featureFlags: {
          [FeatureGates.EVERYTHING]: true,
          [FeatureGates.NEST_EGG_CAMPAIGN]: true
        }
      })
      expect(selectIsNestEggCampaignActive(state)).toBe(true)
    })

    it('should return false when NEST_EGG_CAMPAIGN is OFF', () => {
      const state = createMockRootState({
        featureFlags: {
          [FeatureGates.EVERYTHING]: true,
          [FeatureGates.NEST_EGG_CAMPAIGN]: false
        }
      })
      expect(selectIsNestEggCampaignActive(state)).toBe(false)
    })
  })

  describe('selectIsNestEggEligible', () => {
    describe('wallet type checks', () => {
      it('should return true for SEEDLESS wallet with flags enabled and airdrop opt-in', () => {
        const state = createMockRootState({
          walletType: WalletType.SEEDLESS,
          coreAnalytics: true,
          featureFlags: {
            [FeatureGates.EVERYTHING]: true,
            [FeatureGates.NEST_EGG_CAMPAIGN]: true
          }
        })
        expect(selectIsNestEggEligible(state)).toBe(true)
      })

      it('should return false for MNEMONIC wallet', () => {
        const state = createMockRootState({
          walletType: WalletType.MNEMONIC,
          coreAnalytics: true,
          featureFlags: {
            [FeatureGates.EVERYTHING]: true,
            [FeatureGates.NEST_EGG_CAMPAIGN]: true
          }
        })
        expect(selectIsNestEggEligible(state)).toBe(false)
      })

      it('should return false for KEYSTONE wallet', () => {
        const state = createMockRootState({
          walletType: WalletType.KEYSTONE,
          coreAnalytics: true,
          featureFlags: {
            [FeatureGates.EVERYTHING]: true,
            [FeatureGates.NEST_EGG_CAMPAIGN]: true
          }
        })
        expect(selectIsNestEggEligible(state)).toBe(false)
      })
    })

    describe('airdrop opt-in checks', () => {
      it('should return false when user opted out of airdrops (coreAnalytics: false)', () => {
        const state = createMockRootState({
          walletType: WalletType.SEEDLESS,
          coreAnalytics: false,
          featureFlags: {
            [FeatureGates.EVERYTHING]: true,
            [FeatureGates.NEST_EGG_CAMPAIGN]: true
          }
        })
        expect(selectIsNestEggEligible(state)).toBe(false)
      })

      it('should return false when user never saw airdrop prompt (coreAnalytics: undefined)', () => {
        const state = createMockRootState({
          walletType: WalletType.SEEDLESS,
          coreAnalytics: undefined,
          featureFlags: {
            [FeatureGates.EVERYTHING]: true,
            [FeatureGates.NEST_EGG_CAMPAIGN]: true
          }
        })
        expect(selectIsNestEggEligible(state)).toBe(false)
      })

      it('should return true when user opted into airdrops (coreAnalytics: true)', () => {
        const state = createMockRootState({
          walletType: WalletType.SEEDLESS,
          coreAnalytics: true,
          featureFlags: {
            [FeatureGates.EVERYTHING]: true,
            [FeatureGates.NEST_EGG_CAMPAIGN]: true
          }
        })
        expect(selectIsNestEggEligible(state)).toBe(true)
      })
    })

    describe('feature flag checks', () => {
      it('should return false when EVERYTHING flag is OFF', () => {
        const state = createMockRootState({
          walletType: WalletType.SEEDLESS,
          coreAnalytics: true,
          featureFlags: {
            [FeatureGates.EVERYTHING]: false,
            [FeatureGates.NEST_EGG_CAMPAIGN]: true
          }
        })
        expect(selectIsNestEggEligible(state)).toBe(false)
      })

      it('should return false when both Nest Egg flags are OFF', () => {
        const state = createMockRootState({
          walletType: WalletType.SEEDLESS,
          coreAnalytics: true,
          featureFlags: {
            [FeatureGates.EVERYTHING]: true,
            [FeatureGates.NEST_EGG_CAMPAIGN]: false,
            [FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY]: false
          }
        })
        expect(selectIsNestEggEligible(state)).toBe(false)
      })

      it('should return true when only NEST_EGG_CAMPAIGN is ON', () => {
        const state = createMockRootState({
          walletType: WalletType.SEEDLESS,
          coreAnalytics: true,
          featureFlags: {
            [FeatureGates.EVERYTHING]: true,
            [FeatureGates.NEST_EGG_CAMPAIGN]: true,
            [FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY]: false
          }
        })
        expect(selectIsNestEggEligible(state)).toBe(true)
      })

      it('should return true when both Nest Egg flags are ON', () => {
        const state = createMockRootState({
          walletType: WalletType.SEEDLESS,
          coreAnalytics: true,
          featureFlags: {
            [FeatureGates.EVERYTHING]: true,
            [FeatureGates.NEST_EGG_CAMPAIGN]: true,
            [FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY]: true
          }
        })
        expect(selectIsNestEggEligible(state)).toBe(true)
      })
    })

    describe('nest-egg-new-seedless-only mode', () => {
      it('should return FALSE for existing seedless user (not new, has not seen campaign)', () => {
        const state = createMockRootState({
          walletType: WalletType.SEEDLESS,
          coreAnalytics: true,
          featureFlags: {
            [FeatureGates.EVERYTHING]: true,
            [FeatureGates.NEST_EGG_CAMPAIGN]: false,
            [FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY]: true
          },
          nestEggState: {
            isNewSeedlessUser: false,
            hasSeenCampaign: false
          }
        })
        expect(selectIsNestEggEligible(state)).toBe(false)
      })

      it('should return TRUE for new seedless user (isNewSeedlessUser: true)', () => {
        const state = createMockRootState({
          walletType: WalletType.SEEDLESS,
          coreAnalytics: true,
          featureFlags: {
            [FeatureGates.EVERYTHING]: true,
            [FeatureGates.NEST_EGG_CAMPAIGN]: false,
            [FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY]: true
          },
          nestEggState: {
            isNewSeedlessUser: true,
            hasSeenCampaign: false
          }
        })
        expect(selectIsNestEggEligible(state)).toBe(true)
      })

      it('should return TRUE for user who has seen the campaign modal', () => {
        const state = createMockRootState({
          walletType: WalletType.SEEDLESS,
          coreAnalytics: true,
          featureFlags: {
            [FeatureGates.EVERYTHING]: true,
            [FeatureGates.NEST_EGG_CAMPAIGN]: false,
            [FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY]: true
          },
          nestEggState: {
            isNewSeedlessUser: false,
            hasSeenCampaign: true
          }
        })
        expect(selectIsNestEggEligible(state)).toBe(true)
      })
    })
  })
})
