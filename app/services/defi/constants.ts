export const CHAIN_LIST = 'chain/list'
export const PROTOCOL = 'user/protocol'
export const SIMPLE_PROTOCOL_LIST = 'user/all_simple_protocol_list'

// We're only loading exchange rates for USD at the moment.
export const CURRENCY_EXCHANGE_RATES_URL =
  'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/usd.min.json'

export const refetchIntervals = {
  deFiProtocolList: 30000, // 30 seconds
  deFiProtocol: 30000 // 30 seconds
}
