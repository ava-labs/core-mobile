const isCI = process.env.APP_ENV === 'ci'

// use production environment on CI for stability
const TOKEN_AGGREGATOR_SCHEMA_URL = isCI
  ? 'https://core-token-aggregator.avax.network/schema.json'
  : 'https://core-token-aggregator.avax-test.network/schema.json'

export default {
  input: TOKEN_AGGREGATOR_SCHEMA_URL,
  output: './app/utils/api/generated/tokenAggregator/aggregatorApi.client',
  plugins: ['@hey-api/client-fetch']
}
