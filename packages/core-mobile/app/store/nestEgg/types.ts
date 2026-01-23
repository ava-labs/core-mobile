export interface NestEggState {
  // Whether the user has seen the campaign announcement modal
  hasSeenCampaign: boolean
  // Whether the user has qualified for the giveaway by completing a swap
  hasQualified: boolean
  // Timestamp when the user qualified (completed first qualifying swap)
  qualifiedAt: number | null
  // The transaction hash of the qualifying swap
  qualifyingTxHash: string | null
  // Whether the user has acknowledged receiving the airdrop (clicked "Got It")
  hasAcknowledgedQualification: boolean
}

export const MINIMUM_SWAP_AMOUNT_USD = 10

// Campaign landing page URL
export const NEST_EGG_CAMPAIGN_URL = 'https://core.app/nest-egg'
