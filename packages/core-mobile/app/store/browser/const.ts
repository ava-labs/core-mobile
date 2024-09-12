export const MAXIMUM_TABS = 100
export const MAXIMUM_TAB_HISTORIES = 20
export const MAXIMUM_HISTORIES = MAXIMUM_TABS * MAXIMUM_TAB_HISTORIES

export type SugggestedItem = {
  name: SuggestedLogo
  siteUrl: string
}

export enum SuggestedLogo {
  TRADER_JOE = 'Trader Joe',
  YIELD_YAK = 'Yield Yak',
  GMX = 'GMX',
  AAVE = 'Aave',
  GOGOPOOL = 'GoGoPool',
  SALVOR = 'Salvor',
  DELTA_PRIME = 'Delta Prime',
  THE_ARENA = 'The Arena',
  STEAKHUT = 'SteakHut',
  PHARAOH = 'Pharaoh',
  PANGOLIN = 'Pangolin',
  BENQI = 'Benqi'
}

export const SUGGESTED_ITEMS: SugggestedItem[] = [
  {
    name: SuggestedLogo.TRADER_JOE,
    siteUrl: 'https://traderjoexyz.com'
  },
  {
    name: SuggestedLogo.YIELD_YAK,
    siteUrl: 'https://yieldyak.com/avalanche/'
  },
  {
    name: SuggestedLogo.GMX,
    siteUrl: 'https://app.gmx.io/#/trade'
  },
  {
    name: SuggestedLogo.AAVE,
    siteUrl: 'https://app.aave.com/'
  },
  {
    name: SuggestedLogo.GOGOPOOL,
    siteUrl: 'https://www.gogopool.com/'
  },
  {
    name: SuggestedLogo.SALVOR,
    siteUrl: 'https://salvor.io/'
  },
  {
    name: SuggestedLogo.DELTA_PRIME,
    siteUrl: 'https://app.deltaprime.io/#/pools'
  },
  {
    name: SuggestedLogo.THE_ARENA,
    siteUrl: 'https://arena.social/'
  },
  {
    name: SuggestedLogo.STEAKHUT,
    siteUrl: 'https://app.steakhut.finance/liquidity'
  },
  {
    name: SuggestedLogo.PHARAOH,
    siteUrl: 'https://pharaoh.exchange/swap'
  },
  {
    name: SuggestedLogo.PANGOLIN,
    siteUrl: 'https://app.pangolin.exchange/'
  },
  {
    name: SuggestedLogo.BENQI,
    siteUrl: 'https://benqi.fi/'
  }
]
