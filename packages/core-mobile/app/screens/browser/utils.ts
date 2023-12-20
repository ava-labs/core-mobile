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
