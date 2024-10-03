import { http } from 'msw'
import validators from 'tests/fixtures/pvm/validators.json'

const endpoints = {
  coingecko: 'https://api.coingecko.com/api/v3',
  glacier: process.env.GLACIER_URL,
  avalanche: 'https://api.avax-test.network'
}

export const handlers = [
  // pvm
  http.post(`${endpoints.avalanche}/ext/bc/P`, async ({ request }) => {
    const body = await request.json()

    // @ts-expect-error
    const { method } = body

    if (method === 'platform.getCurrentValidators') {
      const response = {
        jsonrpc: '2.0',
        result: validators
      }

      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      })
    }
  })
]
