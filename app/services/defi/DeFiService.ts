import Config from 'react-native-config'
import {
  DeFiProtocolObject,
  DeFiSimpleProtocolObject,
  DeFiChainObject
} from './debankTypes'
import { DeFiSimpleProtocol } from './types'
import { CHAIN_LIST, PROTOCOL, SIMPLE_PROTOCOL_LIST } from './constants'

if (!Config.PROXY_URL) throw Error('PROXY_URL is missing')

class DeFiService {
  private baseUrl: string
  private headers: Record<string, string>

  constructor() {
    this.baseUrl = Config.PROXY_URL + '/proxy/debank/v1'
    this.headers = {
      'Content-Type': 'application/json'
    }
  }

  async getSupportedChainList(): Promise<DeFiChainObject[]> {
    const chainListUrl = `${this.baseUrl}/${CHAIN_LIST}`

    const supportedChainList = await fetch(chainListUrl, {
      headers: this.headers
    })
    const jsonRes = (await supportedChainList.json()) as DeFiChainObject[]
    return jsonRes
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

    const urlWithQueryParam = `${userProtocolUrl}?${params}`
    const userProtocolList = await fetch(urlWithQueryParam, {
      headers: this.headers
    })
    const jsonRes = (await userProtocolList.json()) as DeFiProtocolObject
    return jsonRes
  }

  async getDeFiProtocolList(
    userAddress: string
  ): Promise<DeFiSimpleProtocolObject[]> {
    const userProtocolListUrl = `${this.baseUrl}/${SIMPLE_PROTOCOL_LIST}`
    const params = new URLSearchParams({
      id: userAddress
    })

    const urlWithQueryParam = `${userProtocolListUrl}?${params}`
    const userProtocolList = await fetch(urlWithQueryParam, {
      headers: this.headers
    })
    const jsonRes =
      (await userProtocolList.json()) as DeFiSimpleProtocolObject[]
    return jsonRes
  }

  sortSimpleProtocols(protocols: DeFiSimpleProtocol[]): DeFiSimpleProtocol[] {
    return [...protocols].sort(
      ({ netUsdValue: valueA }, { netUsdValue: valueB }) => valueB - valueA
    )
  }
}

export default new DeFiService()
