import { NftItem } from 'services/nft/types'
import { getDateInMmmDdYyyyHhMmA } from 'utils/date/getDateInMmmDdYyyyHhMmA'
import { humanize } from 'utils/string/humanize'

export function getCollectibleAttributes(
  collectible: NftItem | undefined
): { title: string; value: string }[] {
  if (
    collectible?.processedMetadata?.attributes === undefined ||
    collectible?.processedMetadata?.attributes.length === 0
  )
    return []

  if (Array.isArray(collectible.processedMetadata.attributes)) {
    return collectible.processedMetadata.attributes
      .map(item => {
        if (item.trait_type.length === 0 && item.value.length === 0) {
          return
        }
        return {
          title: humanize(item.trait_type),
          value:
            item.display_type === 'date'
              ? getDateInMmmDdYyyyHhMmA(Number(item.value))
              : item.value
        }
      })
      .filter(item => item !== undefined)
  }

  if (typeof collectible.processedMetadata.attributes === 'object') {
    return Object.entries(collectible.processedMetadata.attributes).reduce(
      (acc, [key, value]) => {
        const stringValue = value as unknown as string
        if (key.length === 0 && stringValue.length === 0) {
          return acc
        }
        acc.push({
          title: humanize(key),
          value: stringValue
        })
        return acc
      },
      [] as {
        title: string
        value: string
      }[]
    )
  }
  return []
}
