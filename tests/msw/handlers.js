import { rest } from 'msw'
import coingeckoResponse from './coingeckoResponse.json'
import glacierTokenList from './glacierTokenList.json'
import coingeckoSimplePrice from './coingeckoSimplePrice.json'
import coingeckoBitcoin from './coingeckoBitcoin.json'

export const handlers = [
  rest.get(
    'https://api.coingecko.com/api/v3/coins/markets',
    async (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(coingeckoResponse))
    }
  ),

  rest.get(
    'https://glacier-api-dev.avax.network/tokenlist',
    async (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(glacierTokenList))
    }
  ),

  rest.get(
    'https://api.coingecko.com/api/v3/simple/price',
    async (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(coingeckoSimplePrice))
    }
  ),

  rest.get(
    'https://api.coingecko.com/api/v3/coins/bitcoin',
    async (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(coingeckoBitcoin))
    }
  )
]
