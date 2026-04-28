const isCI = process.env.APP_ENV === 'ci'

// use production environment on CI for stability
const TOKEN_AGGREGATOR_SCHEMA_URL = isCI
  ? 'https://core-token-aggregator.avax.network/schema.json'
  : 'https://core-token-aggregator.avax-test.network/schema.json'

// TODO: remove once the backend updates the OpenAPI schema to 3.1.1.
// openapi-ts drops `nullable: true` when it's combined with `enum`, so
// fields like `contractType` end up typed as a non-null union. Walking
// each affected schema and pushing `null` onto the enum array forces
// the generator to include `| null`. OpenAPI 3.1.x encodes nullability
// differently and this workaround won't be needed.
const addNullToNullableEnums = node => {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    node.forEach(addNullToNullableEnums)
    return
  }
  if (
    node.nullable === true &&
    Array.isArray(node.enum) &&
    !node.enum.includes(null)
  ) {
    node.enum.push(null)
  }
  for (const value of Object.values(node)) {
    addNullToNullableEnums(value)
  }
}

export default {
  input: TOKEN_AGGREGATOR_SCHEMA_URL,
  output: './app/utils/api/generated/tokenAggregator/aggregatorApi.client',
  parser: {
    patch: {
      schemas: {
        TokenListResponse: addNullToNullableEnums,
        NetworkTokensByCaip2Response: addNullToNullableEnums
      }
    }
  },
  plugins: ['@hey-api/client-fetch']
}
