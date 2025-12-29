const isCI = process.env.APP_ENV === 'ci'

const GLACIER_SCHEMA_URL = isCI
  ? 'https://glacier-api.avax.network/api-json'
  : 'https://glacier-api-dev.avax.network/api-json'

export default {
  input: GLACIER_SCHEMA_URL,
  output: './app/utils/api/generated/glacier/glacierApi.client',
  plugins: ['@hey-api/client-fetch']
}
