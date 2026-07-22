/**
 * Market categorization for the perps list.
 *
 * Two taxonomies are merged into a single `coin → categories` index:
 *
 * 1. **Native crypto sectors** (`ai`, `defi`, `layer1`, …) — hand-curated from
 *    the Hyperliquid frontend, since there is no API for them. Keyed by the bare
 *    ticker (`BTC`, `ETH`, …) as it appears in the main-dex universe.
 * 2. **HIP-3 asset classes** (`stocks`, `commodities`, …) — fetched at runtime
 *    via the perps-sdk `getPerpCategories()` endpoint. Keyed by the full
 *    `deployer:TICKER` coin name (`xyz:GOLD`, `km:AAPL`, …).
 *
 * A coin may belong to multiple categories (e.g. `NEAR` is both `ai` and
 * `layer1`), so the index maps each coin to a `Set` of category ids.
 */

/** Native crypto sectors (no API — curated). */
export const NATIVE_CATEGORY_IDS = [
  'ai',
  'defi',
  'layer1',
  'layer2',
  'gaming',
  'meme'
] as const

/** HIP-3 real-world-asset classes (from `perpCategories`). */
export const RWA_CATEGORY_IDS = [
  'crypto',
  'stocks',
  'commodities',
  'indices',
  'fx',
  'preipo'
] as const

export type CategoryId =
  | typeof NATIVE_CATEGORY_IDS[number]
  | typeof RWA_CATEGORY_IDS[number]

/** Canonical chip ordering: native sectors first, then real-world-asset classes. */
export const CATEGORY_ORDER: readonly CategoryId[] = [
  ...NATIVE_CATEGORY_IDS,
  ...RWA_CATEGORY_IDS
]

/** Display labels (English; category names are largely brand/proper nouns). */
export const CATEGORY_LABELS: Record<CategoryId, string> = {
  ai: 'AI',
  defi: 'DeFi',
  layer1: 'Layer 1',
  layer2: 'Layer 2',
  gaming: 'Gaming',
  meme: 'Meme',
  crypto: 'Crypto',
  stocks: 'Stocks',
  commodities: 'Commodities',
  indices: 'Indices',
  fx: 'FX',
  preipo: 'Pre-IPO'
}

const KNOWN_CATEGORY_IDS = new Set<string>(CATEGORY_ORDER)

/**
 * Native crypto sector → tickers. Curated snapshot of Hyperliquid's frontend
 * sector tags; a ticker may appear under several sectors.
 *
 * NOTE: this is hardcoded on purpose — Hyperliquid exposes **no API** for native
 * perp sectors. The `perpCategories` endpoint covers HIP-3 (builder-deployed)
 * assets only and returns nothing for native perps. HL's own web app ships these
 * tags in its frontend bundle, so this map mirrors that list and must be updated
 * by hand when HL adds/retags a native perp. Unknown/new tickers simply won't
 * match a sector filter (graceful degrade).
 */
const NATIVE_CRYPTO_SECTORS: Record<
  typeof NATIVE_CATEGORY_IDS[number],
  readonly string[]
> = {
  ai: [
    'CHIP',
    'FET',
    'RNDR',
    'TAO',
    'NEAR',
    'WLD',
    'IO',
    'RENDER',
    'GRASS',
    'VIRTUAL',
    'AIXBT',
    'ZEREBRO',
    'GRIFFAIN',
    'VVV',
    'KAITO',
    'PROMPT',
    '0G'
  ],
  defi: [
    'AAVE',
    'BNT',
    'COMP',
    'CRV',
    'DYDX',
    'FRAX',
    'GMX',
    'INJ',
    'LDO',
    'LINK',
    'PENDLE',
    'PYTH',
    'RLB',
    'RUNE',
    'SNX',
    'SUSHI',
    'TRB',
    'UNI',
    'RSR',
    'JTO',
    'MAV',
    'CAKE',
    'UMA',
    'ALT',
    'JUP',
    'ETHFI',
    'REZ',
    'BANANA',
    'ENA',
    'EIGEN',
    'MORPHO',
    'WCT',
    'RESOLV',
    'SYRUP',
    'PUMP',
    'SKY',
    'STBL',
    'MET',
    'AERO'
  ],
  layer1: [
    'ADA',
    'APT',
    'ATOM',
    'AVAX',
    'BCH',
    'BNB',
    'BSV',
    'BTC',
    'CFX',
    'DOT',
    'ETH',
    'FTM',
    'INJ',
    'KAS',
    'LTC',
    'MINA',
    'NEAR',
    'NEO',
    'POLYX',
    'RUNE',
    'SEI',
    'SOL',
    'SUI',
    'TIA',
    'TON',
    'TRX',
    'XRP',
    'ZEN',
    'kLUNC',
    'NTRN',
    'ETC',
    'ZETA',
    'DYM',
    'SAGA',
    'XLM',
    'ALGO',
    'HYPE',
    'S',
    'BERA',
    'IP',
    'OM',
    'INIT',
    'XPL',
    '0G',
    'MON',
    'CC',
    'ICP',
    'STABLE',
    'XMR',
    'FOGO'
  ],
  layer2: [
    'MNT',
    'ZK',
    'BLAST',
    'ARB',
    'OP',
    'STARK',
    'MATIC',
    'POL',
    'IMX',
    'CELO',
    'SCR',
    'STRK',
    'MOVE',
    'LAYER',
    'LINEA',
    'HEMI',
    'MEGA',
    'LIT',
    'AZTEC'
  ],
  gaming: [
    'APE',
    'BIGTIME',
    'BLZ',
    'ILV',
    'IMX',
    'YGG',
    'GMT',
    'SUPER',
    'GALA',
    'ACE',
    'XAI',
    'MAVIA',
    'HMSTR',
    'NOT',
    'SAND',
    'NXPC',
    'AXS'
  ],
  meme: [
    'DOGE',
    'HPOS',
    'kPEPE',
    'SHIA',
    'kSHIB',
    'kBONK',
    'MEME',
    'WIF',
    'PEOPLE',
    'MYRO',
    'kFLOKI',
    'BOME',
    'POPCAT',
    'TURBO',
    'BRETT',
    'MEW',
    'kNEIRO',
    'GOAT',
    'MOODENG',
    'PNUT',
    'CHILLGUY',
    'FARTCOIN',
    'SPX',
    'TRUMP',
    'MELANIA',
    'VINE',
    'JELLY',
    'TST',
    'PENGU',
    'YZY'
  ]
}

/** A single `[coin, category]` entry from the perps-sdk `getPerpCategories()`. */
export type CoinCategory = {
  readonly coin: string
  readonly category: string
}

/** Maps each coin to the set of categories it belongs to. */
export type CoinCategoryIndex = ReadonlyMap<string, ReadonlySet<CategoryId>>

const addToIndex = (
  index: Map<string, Set<CategoryId>>,
  coin: string,
  category: CategoryId
): void => {
  const existing = index.get(coin)
  if (existing) {
    existing.add(category)
  } else {
    index.set(coin, new Set([category]))
  }
}

/**
 * Normalize a deployer-supplied HIP-3 category label to a known {@link CategoryId},
 * or `undefined` when it isn't one we surface (deployers can set arbitrary labels).
 */
const normalizeHip3Category = (raw: string): CategoryId | undefined => {
  const id = raw.trim().toLowerCase()
  return KNOWN_CATEGORY_IDS.has(id) ? (id as CategoryId) : undefined
}

/**
 * Build the `coin → categories` index from the static native sectors plus the
 * (optional) HIP-3 categories fetched from the SDK.
 */
export const buildCoinCategoryIndex = (
  hip3Categories: readonly CoinCategory[] = []
): CoinCategoryIndex => {
  const index = new Map<string, Set<CategoryId>>()

  for (const id of NATIVE_CATEGORY_IDS) {
    for (const ticker of NATIVE_CRYPTO_SECTORS[id]) {
      addToIndex(index, ticker, id)
    }
  }

  for (const { coin, category } of hip3Categories) {
    const id = normalizeHip3Category(category)
    if (id !== undefined) {
      addToIndex(index, coin, id)
    }
  }

  return index
}

/**
 * The subset of {@link CATEGORY_ORDER} that has at least one market present in
 * `coinNames`, in canonical order — so we never render an empty category chip.
 */
export const availableCategories = (
  coinNames: readonly string[],
  index: CoinCategoryIndex
): readonly CategoryId[] => {
  const present = new Set<CategoryId>()
  for (const name of coinNames) {
    const cats = index.get(name)
    if (cats) {
      for (const c of cats) {
        present.add(c)
      }
    }
  }
  return CATEGORY_ORDER.filter(c => present.has(c))
}
