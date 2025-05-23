import { DeFiProtocolInformation } from 'services/browser/types'
import { FavoriteId } from 'store/browser'
import { SuggestedSiteName } from 'store/browser/const'
import { assertNotUndefined } from 'utils/assertions'

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
  const nextColor = cycleColors[index % cycleColors.length]
  assertNotUndefined(nextColor)
  return nextColor
}

export const removeTrailingSlash = (url: string): string => {
  return url.replace(/\/$/, '')
}

export const isSuggestedSiteName = (name?: string): boolean => {
  if (name === undefined) return false
  return Object.values(SuggestedSiteName)
    .map(item => item.toLowerCase())
    .includes(name.toLowerCase() as SuggestedSiteName)
}

export const isBase64Png = (imageData: string): boolean => {
  return imageData.startsWith('data:image/png;base64')
}

export const prepareFaviconToLoad = (
  url: string,
  favicon?: string
): string | undefined => {
  try {
    const activeHistoryUrl = new URL(url)
    const activeHistoryDomain =
      activeHistoryUrl.protocol + '//' + activeHistoryUrl.hostname

    if (favicon) {
      if (
        isSuggestedSiteName(favicon as SuggestedSiteName) ||
        isValidUrl(favicon) ||
        isBase64Png(favicon)
      ) {
        return favicon
      } else {
        if (favicon.startsWith('/')) {
          return activeHistoryDomain + favicon
        }
        return activeHistoryDomain + '/' + favicon
      }
    }
  } catch {
    return ''
  }
}

export function getSuggestedImage(name: string): SuggestedSiteName | undefined {
  switch (name) {
    case SuggestedSiteName.LFJ:
      return require('assets/icons/browser_suggested_icons/traderjoe.png')
    case SuggestedSiteName.YIELD_YAK:
      return require('assets/icons/browser_suggested_icons/yieldyak.png')
    case SuggestedSiteName.GMX:
      return require('assets/icons/browser_suggested_icons/gmx.png')
    case SuggestedSiteName.AAVE:
      return require('assets/icons/browser_suggested_icons/aave.png')
    case SuggestedSiteName.GOGOPOOL:
      return require('assets/icons/browser_suggested_icons/ggp.png')
    case SuggestedSiteName.SALVOR:
      return require('assets/icons/browser_suggested_icons/salvor.png')
    case SuggestedSiteName.DELTA_PRIME:
      return require('assets/icons/browser_suggested_icons/deltaprime.png')
    case SuggestedSiteName.THE_ARENA:
      return require('assets/icons/browser_suggested_icons/arena.png')
    case SuggestedSiteName.STEAKHUT:
      return require('assets/icons/browser_suggested_icons/steakhut.png')
    case SuggestedSiteName.PHARAOH:
      return require('assets/icons/browser_suggested_icons/pharaoh.png')
    case SuggestedSiteName.PANGOLIN:
      return require('assets/icons/browser_suggested_icons/pango.png')
    case SuggestedSiteName.BENQI:
      return require('assets/icons/browser_suggested_icons/benqi.png')
  }
}
