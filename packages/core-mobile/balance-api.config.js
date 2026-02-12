const isCI = process.env.APP_ENV === 'ci'

const BALANCE_SCHEMA_URL = isCI
  ? 'https://core-balance-api.avax.network/schema.json'
  : 'https://core-balance-api.avax-test.network/schema.json'

export default {
  input: BALANCE_SCHEMA_URL,
  output: './app/utils/api/generated/balanceApi.client',
  plugins: ['@hey-api/client-fetch']
}
