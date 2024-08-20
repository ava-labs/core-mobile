import { ImageRequireSource } from 'react-native'

export const MAXIMUM_TABS = 100
export const MAXIMUM_TAB_HISTORIES = 20
export const MAXIMUM_HISTORIES = MAXIMUM_TABS * MAXIMUM_TAB_HISTORIES

export type SugggestedItem = {
  name: string
  siteUrl: string
  logo: ImageRequireSource
}

export const SUGGESTED_ITEMS: SugggestedItem[] = [
  {
    name: 'Trader Joe',
    siteUrl: 'https://traderjoexyz.com',
    logo: require('assets/icons/browser_suggested_icons/traderjoe.png')
  },
  {
    name: 'Yield Yak',
    siteUrl: 'https://yieldyak.com/avalanche/',
    logo: require('assets/icons/browser_suggested_icons/yieldyak.png')
  },
  {
    name: 'GMX',
    siteUrl: 'https://app.gmx.io/#/trade',
    logo: require('assets/icons/browser_suggested_icons/gmx.png')
  },
  {
    name: 'Aave',
    siteUrl: 'https://app.aave.com/',
    logo: require('assets/icons/browser_suggested_icons/aave.png')
  },
  {
    name: 'GoGoPool',
    siteUrl: 'https://www.gogopool.com/',
    logo: require('assets/icons/browser_suggested_icons/ggp.png')
  },
  {
    name: 'Salvor',
    siteUrl: 'https://salvor.io/',
    logo: require('assets/icons/browser_suggested_icons/salvor.png')
  },
  {
    name: 'Delta Prime',
    siteUrl: 'https://app.deltaprime.io/#/pools',
    logo: require('assets/icons/browser_suggested_icons/deltaprime.png')
  },
  {
    name: 'The Arena',
    siteUrl: 'https://arena.social/',
    logo: require('assets/icons/browser_suggested_icons/arena.png')
  },
  {
    name: 'SteakHut',
    siteUrl: 'https://app.steakhut.finance/liquidity',
    logo: require('assets/icons/browser_suggested_icons/steakhut.png')
  },
  {
    name: 'Pharaoh',
    siteUrl: 'https://pharaoh.exchange/swap',
    logo: require('assets/icons/browser_suggested_icons/pharaoh.png')
  },
  {
    name: 'Pangolin',
    siteUrl: 'https://app.pangolin.exchange/',
    logo: require('assets/icons/browser_suggested_icons/pango.png')
  },
  {
    name: 'Benqi',
    siteUrl: 'https://benqi.fi/',
    logo: require('assets/icons/browser_suggested_icons/benqi.png')
  }
]
