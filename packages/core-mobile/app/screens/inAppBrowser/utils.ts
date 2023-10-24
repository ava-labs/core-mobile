import { DeFiProtocolInformation } from 'services/inAppBrowser/types'

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
