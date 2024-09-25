export const MAXIMUM_TABS = 100
export const MAXIMUM_TAB_HISTORIES = 20
export const MAXIMUM_HISTORIES = MAXIMUM_TABS * MAXIMUM_TAB_HISTORIES

export type SuggestedItem = {
  name: SuggestedSiteName
  siteUrl: string
}

export enum SuggestedSiteName {
  LFJ = 'LFJ',
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

export const SUGGESTED_ITEMS: SuggestedItem[] = [
  {
    name: SuggestedSiteName.LFJ,
    siteUrl: 'https://lfj.gg/'
  },
  {
    name: SuggestedSiteName.YIELD_YAK,
    siteUrl: 'https://yieldyak.com/avalanche/'
  },
  {
    name: SuggestedSiteName.GMX,
    siteUrl: 'https://app.gmx.io/#/trade'
  },
  {
    name: SuggestedSiteName.AAVE,
    siteUrl: 'https://app.aave.com/'
  },
  {
    name: SuggestedSiteName.GOGOPOOL,
    siteUrl: 'https://www.gogopool.com/'
  },
  {
    name: SuggestedSiteName.SALVOR,
    siteUrl: 'https://salvor.io/'
  },
  {
    name: SuggestedSiteName.DELTA_PRIME,
    siteUrl: 'https://app.deltaprime.io/#/pools'
  },
  {
    name: SuggestedSiteName.THE_ARENA,
    siteUrl: 'https://arena.social/'
  },
  {
    name: SuggestedSiteName.STEAKHUT,
    siteUrl: 'https://app.steakhut.finance/liquidity'
  },
  {
    name: SuggestedSiteName.PHARAOH,
    siteUrl: 'https://pharaoh.exchange/swap'
  },
  {
    name: SuggestedSiteName.PANGOLIN,
    siteUrl: 'https://app.pangolin.exchange/'
  },
  {
    name: SuggestedSiteName.BENQI,
    siteUrl: 'https://benqi.fi/'
  }
]
