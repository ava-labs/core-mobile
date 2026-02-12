const isCI = process.env.APP_ENV === 'ci'

const PROFILE_SCHEMA_URL = isCI
  ? 'https://core-profile-api.avax.network/schema.json'
  : 'https://core-profile-api.avax-test.network/schema.json'

export default {
  input: PROFILE_SCHEMA_URL,
  output: './app/utils/api/generated/profileApi.client',
  plugins: ['@hey-api/client-fetch']
}
