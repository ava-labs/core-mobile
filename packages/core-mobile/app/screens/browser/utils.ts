import { DeFiProtocolInformation } from 'services/browser/types'

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
  let urlObj
  try {
    urlObj = new URL(url)
  } catch (error) {
    return false
  }

  return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
}

export function normalizeUrlWithHttps(url: string): string {
  if (isValidUrl(url)) return url

  return `https://${url}`
}
