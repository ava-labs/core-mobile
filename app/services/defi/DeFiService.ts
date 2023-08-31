import Config from 'react-native-config'
import Logger from 'utils/Logger'
import {
  DeFiProtocolObject,
  DeFiSimpleProtocolObject,
  DeFiChainObject
} from './models'
import { DeFiSimpleProtocol } from './types'
import { CHAIN_LIST, PROTOCOL, SIMPLE_PROTOCOL_LIST } from './constants'

if (!Config.DEBANK_URL) throw Error('DEBANK_URL ENV is missing')
if (!Config.DEBANK_API_KEY) throw Error('DEBANK_API_KEY ENV is missing')

class DeFiService {
  private baseUrl: string
  private headers: Record<string, string>

  constructor() {
    this.baseUrl = Config.DEBANK_URL ?? ''
    this.headers = {
      AccessKey: Config.DEBANK_API_KEY ?? '',
      'Content-Type': 'application/json'
    }
  }

  async getSupportedChainList(): Promise<DeFiChainObject[]> {
    const chainListUrl = `${this.baseUrl}/${CHAIN_LIST}`

    try {
      const supportedChainList = await fetch(chainListUrl, {
        headers: this.headers
      })
      const jsonRes = (await supportedChainList.json()) as DeFiChainObject[]
      return jsonRes
    } catch (e) {
      Logger.error('getSupportedChainList failed', e)
      throw Error(`getSupportedChainList failed. ${e}`)
    }
  }

  async getDeFiProtocol(
    userAddress: string,
    protocolId: string
  ): Promise<DeFiProtocolObject> {
    const userProtocolUrl = `${this.baseUrl}/${PROTOCOL}`
    const params = new URLSearchParams({
      id: userAddress,
      protocol_id: protocolId
    })

    try {
      const urlWithQueryParam = `${userProtocolUrl}?${params}`
      const userProtocolList = await fetch(urlWithQueryParam, {
        headers: this.headers
      })
      const jsonRes = (await userProtocolList.json()) as DeFiProtocolObject
      return jsonRes
    } catch (e) {
      Logger.error('getUserProtocol failed', e)
      throw Error(`getUserProtocol failed. ${e}`)
    }
  }

  async getDeFiProtocolList(
    userAddress: string
  ): Promise<DeFiSimpleProtocolObject[]> {
    const userProtocolListUrl = `${this.baseUrl}/${SIMPLE_PROTOCOL_LIST}`
    const params = new URLSearchParams({
      id: userAddress
    })

    try {
      const urlWithQueryParam = `${userProtocolListUrl}?${params}`
      const userProtocolList = await fetch(urlWithQueryParam, {
        headers: this.headers
      })
      const jsonRes =
        (await userProtocolList.json()) as DeFiSimpleProtocolObject[]
      return jsonRes
    } catch (e) {
      Logger.error('getUserProtocolList failed', e)
      throw Error(`getUserProtocolList failed. ${e}`)
    }
  }

  sortSimpleProtocols(protocols: DeFiSimpleProtocol[]): DeFiSimpleProtocol[] {
    return [...protocols].sort(
      ({ netUsdValue: valueA }, { netUsdValue: valueB }) => valueB - valueA
    )
  }
}

export default new DeFiService()
