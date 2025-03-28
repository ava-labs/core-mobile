export const initialState: PortfolioState = {
  tokenVisibility: {},
  collectibleVisibility: {},
  collectibleUnprocessableVisibility: true
}

export type TokenVisibility = Record<string, boolean>
export type CollectibleVisibility = Record<string, boolean>

export type PortfolioState = {
  tokenVisibility: TokenVisibility
  collectibleVisibility: CollectibleVisibility
  collectibleUnprocessableVisibility: boolean
}
