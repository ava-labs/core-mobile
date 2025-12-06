export default {
  input: 'https://core-balance-api.avax-test.network/schema.json',
  output: './app/utils/apiClient/generated/balanceApi.client',
  plugins: ['@hey-api/client-fetch']
}
