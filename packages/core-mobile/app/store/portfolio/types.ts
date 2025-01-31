export const initialState: PortfolioState = {
  tokenVisibility: {}
}

export type TokenVisibility = Record<string, boolean>

export type PortfolioState = {
  tokenVisibility: TokenVisibility
}
