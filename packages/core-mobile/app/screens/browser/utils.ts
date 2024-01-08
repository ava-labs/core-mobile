import { DeFiProtocolInformation } from 'services/browser/types'
import { assertNotUndefined } from 'utils/assertions'
import { FavoriteId } from 'store/browser'

export const sortDeFiProtocolInformationListByTvl = (
  protocolInformationList: DeFiProtocolInformation[]
): DeFiProtocolInformation[] => {
  return [...protocolInformationList].sort(({ tvl: a }, { tvl: b }) => b - a)
}

export const getTopDefiProtocolInformationList = (
  protocolInformationList?: DeFiProtocolInformation[],
  limit = 8
): DeFiProtocolInformation[] => {
  if (protocolInformationList === undefined) return []
  const sorted = sortDeFiProtocolInformationListByTvl(protocolInformationList)
  return sorted.slice(0, limit)
}

export function removeProtocol(url: string): string {
  const urlObj = new URL(url)
  return urlObj.href.replace(`${urlObj.protocol}//`, '')
}

export function isValidUrl(url: string): boolean {
  try {
    return Boolean(new URL(url))
  } catch (error) {
    return false
  }
}

export function isValidHttpUrl(url: string): boolean {
  //urls such as http://core we will discard, it must have at least one dot
  const basicHttpUrlRegex = new RegExp('[^ ]*[.][^ ]*', 'i')
  if (!basicHttpUrlRegex.test(url)) return false

  let urlObj
  try {
    urlObj = new URL(url)
  } catch (error) {
    return false
  }

  return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
}

/**
 * Converts http to https protocol, or if protocol is missing adds https.
 * For invalid url-s returns same as input.
 */
export function normalizeUrlWithHttps(url: string): string {
  let normalized = url.replaceAll('http:', 'https:')
  if (!normalized.startsWith('https')) {
    normalized = `https://${url}`
  }
  if (isValidHttpUrl(normalized)) return normalized

  return url
}

const usedFavIcoColors = new Map<FavoriteId, undefined>()

export function getNextFavColor(id: FavoriteId): string {
  usedFavIcoColors.set(id, undefined)
  const index = [...usedFavIcoColors.keys()].indexOf(id)
  const cycleColors = [
    '#003F5C',
    '#00628F',
    '#2F4B7C',
    '#3E62A3',
    '#665191',
    '#7E68AB',
    '#A05195',
    '#B56DAB',
    '#D45087',
    '#059E93'
  ]
  const nextColor = cycleColors[index % 10]
  assertNotUndefined(nextColor)
  return nextColor
}
