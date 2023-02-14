import { rest } from 'msw'
import coingeckoResponse from 'tests/fixtures/coingeckoResponse'
import glacierTokenList from 'tests/fixtures/glacierTokenList.json'
import coingeckoSimplePrice from 'tests/fixtures/coingeckoSimplePrice.json'
import coingeckoBitcoin from 'tests/fixtures/coingeckoBitcoin.json'

const coingeckoApi = 'https://api.coingecko.com/api/v3'

export const handlers = [
  rest.get(`${coingeckoApi}/coins/markets`, async (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(coingeckoResponse))
  }),

  rest.get(
    `${process.env.GLACIER_URL}/tokenlist`,
    async (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(glacierTokenList))
    }
  ),

  rest.get(`${coingeckoApi}/simple/price`, async (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(coingeckoSimplePrice))
  }),

  rest.get(`${coingeckoApi}/coins/bitcoin`, async (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(coingeckoBitcoin))
  })
]
