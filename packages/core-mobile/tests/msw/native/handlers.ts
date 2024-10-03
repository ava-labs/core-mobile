import { http } from 'msw'
import coingeckoResponse from 'tests/fixtures/coingeckoResponse.json'
import glacierTokenList from 'tests/fixtures/glacierTokenList.json'
import coingeckoSimplePrice from 'tests/fixtures/coingeckoSimplePrice.json'
import coingeckoBitcoin from 'tests/fixtures/coingeckoBitcoin.json'
import { endpoints } from '../endpoints'

export const handlers = [
  http.get(`${endpoints.coingecko}/coins/markets`, async () => {
    return new Response(JSON.stringify(coingeckoResponse), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  }),

  http.get(`${endpoints.glacier}/tokenlist`, async () => {
    return new Response(JSON.stringify(glacierTokenList), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  }),

  http.get(`${endpoints.coingecko}/simple/price`, async () => {
    return new Response(JSON.stringify(coingeckoSimplePrice), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  }),

  http.get(`${endpoints.coingecko}/coins/bitcoin`, async () => {
    return new Response(JSON.stringify(coingeckoBitcoin), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  })
]
