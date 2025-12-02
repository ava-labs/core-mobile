export default {
  glacierApis: {
    output: {
      httpClient: 'fetch',
      target: './app/generated/orval/tokens/schema.ts',
      override: {
        mutator: {
          path: './app/utils/nitroFetch/glacierApi.ts',
          name: 'glacierNitroFetchClient'
        }
      }
    },
    input: {
      target: 'https://core-token-aggregator.avax-test.network/schema.json'
    }
  }
}
