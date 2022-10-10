/* eslint-disable @typescript-eslint/no-explicit-any */
export const migrations = {
  1: (state: any) => {
    // replace watchlist store
    return {
      ...state,
      watchlist: {
        tokens: [],
        favorites: []
      }
    }
  },
  2: (state: any) => {
    // expand nft store with nfts
    return {
      ...state,
      nft: {
        ...state.nft,
        nfts: {}
      }
    }
  },
  3: (state: any) => {
    // expand nft store with nfts
    return {
      ...state,
      balance: {
        ...state.balance,
        allTokens: {}
      }
    }
  }
}
