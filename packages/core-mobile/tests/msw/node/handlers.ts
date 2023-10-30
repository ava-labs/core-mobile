import { rest } from 'msw'
import validators from 'tests/fixtures/pvm/validators.json'

const endpoints = {
  coingecko: 'https://api.coingecko.com/api/v3',
  glacier: process.env.GLACIER_URL,
  avalanche: 'https://api.avax-test.network'
}

export const handlers = [
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
