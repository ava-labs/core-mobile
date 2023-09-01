import Config from 'react-native-config'
import {
  DeFiProtocolObject,
  DeFiSimpleProtocolObject,
  DeFiChainObject
} from './debankTypes'
import { DeFiSimpleProtocol } from './types'
import { CHAIN_LIST, PROTOCOL, SIMPLE_PROTOCOL_LIST } from './constants'

if (!Config.PROXY_URL) throw Error('PROXY_URL is missing')

const baseUrl = Config.PROXY_URL + '/proxy/debank/v1'
const chainListUrl = `${baseUrl}/${CHAIN_LIST}`
const userProtocolUrl = `${baseUrl}/${PROTOCOL}`
const userProtocolListUrl = `${baseUrl}/${SIMPLE_PROTOCOL_LIST}`
const headers = {
  'Content-Type': 'application/json'
}

class DeFiService {
  async getSupportedChainList(): Promise<DeFiChainObject[]> {
    const supportedChainList = await fetch(chainListUrl, {
      headers
    })
    const jsonRes = (await supportedChainList.json()) as DeFiChainObject[]
    return jsonRes
  }

  async getDeFiProtocol(
    userAddress: string,
    protocolId: string
  ): Promise<DeFiProtocolObject> {
    const params = new URLSearchParams({
      id: userAddress,
      protocol_id: protocolId
    })
    const urlWithQueryParam = `${userProtocolUrl}?${params}`
    const userProtocolList = await fetch(urlWithQueryParam, {
      headers
    })
    const jsonRes = (await userProtocolList.json()) as DeFiProtocolObject
    return jsonRes
  }

  async getDeFiProtocolList(
    userAddress: string
  ): Promise<DeFiSimpleProtocolObject[]> {
    const params = new URLSearchParams({
      id: userAddress
    })
    const urlWithQueryParam = `${userProtocolListUrl}?${params}`
    const userProtocolList = await fetch(urlWithQueryParam, {
      headers
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
