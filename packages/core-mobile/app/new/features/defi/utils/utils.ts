import {
  DeFiPortfolioItem,
  DeFiProtocolDetailTypes,
  DeFiToken,
  DeFiInsuranceBuyerItem,
  DeFiItem,
  DeFiItemGroup,
  DeFiLendingItem,
  DeFiPerpetualItem,
  DeFiRewardItem,
  DeFiVestingItem,
  DeFiCommonItem
} from 'services/defi/types'

export const mapPortfolioItems = (
  items: DeFiPortfolioItem[]
): DeFiItemGroup[] => {
  const groupItems = items
    .map(item => {
      // DeBank may return multiple detail types with the last one being the most accurate in their estimation.
      // @see https://docs.cloud.debank.com/en/readme/api-models/portfolioitemobject#about-detail_types
      const type =
        item.detailTypes[item.detailTypes.length - 1] ??
        DeFiProtocolDetailTypes.COMMON

      switch (type) {
        case DeFiProtocolDetailTypes.LENDING:
          return mapLendingItem(item)

        case DeFiProtocolDetailTypes.VESTING:
          return mapVestingItem(item)

        case DeFiProtocolDetailTypes.REWARD:
          return mapRewardItem(item)

        case DeFiProtocolDetailTypes.INSURANCE_BUYER:
          return mapInsuranceItem(item)

        case DeFiProtocolDetailTypes.PERPETUALS:
          return mapPerpetualItem(item)

        // Some items we show in a simplified manner, just like
        // the "common" positions.
        case DeFiProtocolDetailTypes.LOCKED:
        case DeFiProtocolDetailTypes.COMMON:
          return mapCommonItem(item)

        default:
          // Return null for items that we don't know how to handle/present yet.
          return null
      }
    })
    .filter(Boolean) as DeFiItem[] // Filter-out the nullish items.

  // sort items by netUsdValue
  const sortedItems = sortDeFiItems(groupItems)

  const groupedByName = sortedItems.reduce(
    (groups: Record<string, DeFiItemGroup>, item: DeFiItem) => {
      const group = groups[item.name] ?? {
        name: item.name,
        totalUsdValue: 0,
        items: []
      }
      groups[item.name] = {
        ...group,
        items: [...group.items, item],
        totalUsdValue: group.totalUsdValue + item.netUsdValue
      }
      return groups
    },
    {} as Record<string, DeFiItemGroup>
  )
  return Object.values(groupedByName)
}

const mapRewardItem = (item: DeFiPortfolioItem): DeFiRewardItem => {
  return {
    name: item.name,
    type: DeFiProtocolDetailTypes.REWARD,
    netUsdValue: item.stats.netUsdValue,
    tokens: item.detail.tokenList
  }
}

const mapPerpetualItem = (item: DeFiPortfolioItem): DeFiPerpetualItem => {
  return {
    type: DeFiProtocolDetailTypes.PERPETUALS,
    name: item.name,
    // We know the fields below are not supposed to be undefined
    // for perpetuals, so we can cast safely.
    positionToken: item.detail.positionToken as DeFiToken,
    marginToken: item.detail.marginToken as DeFiToken,
    profitUsdValue: Number(item.detail.pnlUsdValue),
    netUsdValue: item.stats.netUsdValue
  }
}

const mapInsuranceItem = (item: DeFiPortfolioItem): DeFiInsuranceBuyerItem => {
  return {
    type: DeFiProtocolDetailTypes.INSURANCE_BUYER,
    name: item.name,
    // We know those fields are not supposed to be undefined
    // for insurance, so we can cast safely.
    description: String(item.detail.description),
    expiredAt: Number(item.detail.expiredAt),
    netUsdValue: Number(item.detail.usdValue)
  }
}

const mapVestingItem = (item: DeFiPortfolioItem): DeFiVestingItem => {
  const token = item.detail.token as DeFiToken

  return {
    name: item.name,
    type: DeFiProtocolDetailTypes.VESTING,
    netUsdValue: item.stats.netUsdValue,
    token: {
      ...token,
      claimableAmount: token.claimableAmount
    },
    endAt: item.detail.endAt
  }
}

const mapLendingItem = (item: DeFiPortfolioItem): DeFiLendingItem => {
  return {
    name: item.name,
    type: DeFiProtocolDetailTypes.LENDING,
    healthRate: item.detail.healthRate,
    netUsdValue: item.stats.netUsdValue,
    supplyTokens: item.detail.supplyTokenList,
    rewardTokens: item.detail.rewardTokenList,
    borrowTokens: item.detail.borrowTokenList
  }
}

const mapCommonItem = (item: DeFiPortfolioItem): DeFiCommonItem => {
  return {
    name: item.name,
    type: DeFiProtocolDetailTypes.COMMON,
    netUsdValue: item.stats.netUsdValue,
    supplyTokens: item.detail.supplyTokenList,
    rewardTokens: item.detail.rewardTokenList
  }
}

export const sortDeFiItems = <T extends { netUsdValue: number }>(
  items: T[]
): T[] => {
  return [...items].sort(({ netUsdValue: a }, { netUsdValue: b }) => b - a)
}
