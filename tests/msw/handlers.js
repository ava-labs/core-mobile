import { rest } from 'msw'
import coingeckoResponse from 'tests/fixtures/coingeckoResponse'
import glacierTokenList from 'tests/fixtures/glacierTokenList.json'
import coingeckoSimplePrice from 'tests/fixtures/coingeckoSimplePrice.json'
import coingeckoBitcoin from 'tests/fixtures/coingeckoBitcoin.json'
import validators from 'tests/fixtures/pvm/validators'

const endpoints = {
  coingecko: 'https://api.coingecko.com/api/v3',
  glacier: process.env.GLACIER_URL,
  avalanche: 'https://api.avax-test.network'
}

export const handlers = [
  rest.get(`${endpoints.coingecko}/coins/markets`, async (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(coingeckoResponse))
  }),

  rest.get(`${endpoints.glacier}/tokenlist`, async (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(glacierTokenList))
  }),

  rest.get(`${endpoints.coingecko}/simple/price`, async (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(coingeckoSimplePrice))
  }),

  rest.get(`${endpoints.coingecko}/coins/bitcoin`, async (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(coingeckoBitcoin))
  }),

  // pvm
  rest.post(`${endpoints.avalanche}/ext/bc/P`, async (req, res, ctx) => {
    const body = await req.json()

    if (body.method === 'platform.getCurrentValidators') {
      const response = {
        jsonrpc: '2.0',
        result: validators
      }

      return res(ctx.status(200), ctx.json(response))
    }
  })
]
