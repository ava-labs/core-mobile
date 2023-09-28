import Config from 'react-native-config'
import {
  DeFiProtocolObject,
  DeFiSimpleProtocolObject,
  DeFiChainObject,
  DeFiSimpleProtocolSchema,
  DeFiChainSchema,
  DeFiProtocolSchema
} from './debankTypes'
import { DeFiSimpleProtocol, ExchangeRate, ExchangeRateSchema } from './types'
import {
  CHAIN_LIST,
  CURRENCY_EXCHANGE_RATES_URL,
  PROTOCOL,
  SIMPLE_PROTOCOL_LIST
} from './constants'

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
    const json = await supportedChainList.json()
    return DeFiChainSchema.array().parse(json)
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
    const json = await userProtocolList.json()
    return DeFiProtocolSchema.parse(json)
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
    const json = await userProtocolList.json()
    return DeFiSimpleProtocolSchema.array().parse(json)
  }

  sortSimpleProtocols(protocols: DeFiSimpleProtocol[]): DeFiSimpleProtocol[] {
    return [...protocols].sort(
      ({ netUsdValue: valueA }, { netUsdValue: valueB }) => valueB - valueA
    )
  }

  async getExchangeRates(): Promise<ExchangeRate> {
    const response = await fetch(CURRENCY_EXCHANGE_RATES_URL)
    const json = await response.json()
    return ExchangeRateSchema.parse(json)
  }
}

export default new DeFiService()
