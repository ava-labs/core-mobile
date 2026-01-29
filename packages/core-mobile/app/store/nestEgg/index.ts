export {
  nestEggReducer,
  setIsNewSeedlessUser,
  setHasSeenCampaign,
  setQualified,
  setHasAcknowledgedQualification,
  resetNestEggState,
  selectIsNewSeedlessUser,
  selectHasSeenNestEggCampaign,
  selectHasQualifiedForNestEgg,
  selectNestEggQualifiedAt,
  selectNestEggQualifyingTxHash,
  selectHasAcknowledgedNestEggQualification,
  selectIsNewSeedlessUserEligibleForNestEggModal,
  selectIsUserEligibleForNestEggModal,
  selectShouldShowNestEggSuccessModal
} from './slice'

export { swapCompleted, addNestEggListeners } from './listeners'

export type { NestEggState } from './types'
export { MINIMUM_SWAP_AMOUNT_USD, NEST_EGG_CAMPAIGN_URL } from './types'
