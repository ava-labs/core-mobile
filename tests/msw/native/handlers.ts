import { rest } from 'msw'
import coingeckoResponse from 'tests/fixtures/coingeckoResponse.json'
import glacierTokenList from 'tests/fixtures/glacierTokenList.json'
import coingeckoSimplePrice from 'tests/fixtures/coingeckoSimplePrice.json'
import coingeckoBitcoin from 'tests/fixtures/coingeckoBitcoin.json'
import { endpoints } from '../endpoints'

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
  })
]
