import { DeFiSimpleProtocol } from './types'

class DeFiService {
  sortSimpleProtocols(protocols: DeFiSimpleProtocol[]): DeFiSimpleProtocol[] {
    return [...protocols].sort(
      ({ netUsdValue: valueA }, { netUsdValue: valueB }) => valueB - valueA
    )
  }
}

export default new DeFiService()
