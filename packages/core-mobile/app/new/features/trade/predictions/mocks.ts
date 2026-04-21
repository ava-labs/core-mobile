export type MockMarket = {
  tickerId: string
  title: string
  category: string
  imageUrl: string | null
  openTime: string
  closeTime: string
  expectedExpirationTime: string
  volume: string
  volume24h: string
  kycRequired: boolean
  result: string | null
  yesQuote: { maxBidPrice: string; minAskPrice: string }
  noQuote: { maxBidPrice: string; minAskPrice: string }
  options: {
    label: string
    imageUrl: string | null
    probability: number
  }[]
}

export const MARKETS_MOCK: MockMarket[] = [
  {
    tickerId: 'SPORTS-LIVE-TILE',
    title: 'Tile layout for live events',
    category: 'Sports',
    imageUrl: null,
    openTime: '2026-01-01T00:00:00Z',
    closeTime: '2027-06-01T00:00:00Z',
    expectedExpirationTime: '2027-06-01T00:00:00Z',
    volume: '8200',
    volume24h: '1400',
    kycRequired: false,
    result: null,
    yesQuote: { maxBidPrice: '0.73', minAskPrice: '0.75' },
    noQuote: { maxBidPrice: '0.23', minAskPrice: '0.25' },
    options: [
      {
        label: 'Team 1',
        imageUrl: 'https://picsum.photos/17',
        probability: 0.75
      },
      {
        label: 'Team 2',
        imageUrl: 'https://picsum.photos/17',
        probability: 0.25
      }
    ]
  },
  {
    tickerId: 'EPL-WINNER-2026',
    title: 'English Premier League Winner',
    category: 'Sports',
    imageUrl: 'https://picsum.photos/30',
    openTime: '2026-01-01T00:00:00Z',
    closeTime: '2027-05-20T00:00:00Z',
    expectedExpirationTime: '2027-05-20T00:00:00Z',
    volume: '24500',
    volume24h: '3800',
    kycRequired: false,
    result: null,
    yesQuote: { maxBidPrice: '0.77', minAskPrice: '0.79' },
    noQuote: { maxBidPrice: '0.16', minAskPrice: '0.18' },
    options: [
      {
        label: 'Arsenal',
        imageUrl: 'https://placehold.co/17x17',
        probability: 0.79
      },
      { label: 'Man City', imageUrl: null, probability: 0.18 },
      { label: 'Aston Villa', imageUrl: null, probability: 0.03 }
    ]
  },
  {
    tickerId: 'OSCARS-2026-BEST-PICTURE',
    title: 'Oscars 2026: Best Picture Winner',
    category: 'Entertainment',
    imageUrl: 'https://picsum.photos/30',
    openTime: '2026-01-01T00:00:00Z',
    closeTime: '2027-03-28T00:00:00Z',
    expectedExpirationTime: '2027-03-28T00:00:00Z',
    volume: '11000',
    volume24h: '2100',
    kycRequired: false,
    result: null,
    yesQuote: { maxBidPrice: '0.69', minAskPrice: '0.71' },
    noQuote: { maxBidPrice: '0.16', minAskPrice: '0.18' },
    options: [
      { label: 'One Battle at a Time', imageUrl: null, probability: 0.72 },
      { label: 'Sinners', imageUrl: null, probability: 0.177 },
      { label: 'Hamnet', imageUrl: null, probability: 0.054 },
      { label: 'Marty Supreme', imageUrl: null, probability: 0.039 }
    ]
  },
  {
    tickerId: 'BTC-150K-JUNE-2026',
    title: 'Will Bitcoin reach $150k by the end of June?',
    category: 'Crypto',
    imageUrl: 'https://picsum.photos/30',
    openTime: '2026-01-01T00:00:00Z',
    closeTime: '2026-06-30T00:00:00Z',
    expectedExpirationTime: '2026-06-30T00:00:00Z',
    volume: '43000',
    volume24h: '7200',
    kycRequired: false,
    result: null,
    yesQuote: { maxBidPrice: '0.02', minAskPrice: '0.04' },
    noQuote: { maxBidPrice: '0.94', minAskPrice: '0.96' },
    options: [
      { label: 'No', imageUrl: null, probability: 0.96 },
      { label: 'Yes', imageUrl: null, probability: 0.04 }
    ]
  },
  {
    tickerId: 'LOREM-IPSUM-POLITICS',
    title: 'Lorem ipsum dolor sit amet?',
    category: 'Politics',
    imageUrl: null,
    openTime: '2026-01-01T00:00:00Z',
    closeTime: '2026-12-31T00:00:00Z',
    expectedExpirationTime: '2026-12-31T00:00:00Z',
    volume: '5600',
    volume24h: '900',
    kycRequired: false,
    result: null,
    yesQuote: { maxBidPrice: '0.73', minAskPrice: '0.75' },
    noQuote: { maxBidPrice: '0.23', minAskPrice: '0.25' },
    options: [
      { label: 'Yes', imageUrl: null, probability: 0.75 },
      { label: 'No', imageUrl: null, probability: 0.25 }
    ]
  }
]
