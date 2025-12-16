// scripts/codegen.js
const { execSync } = require('child_process')
const path = require('path')

const root = path.resolve(__dirname, '..')

const isCI = process.env.APP_ENV === 'ci'

const PROFILE_SCHEMA_URL = isCI
  ? 'https://core-profile-api.avax.network/schema.json'
  : 'https://core-profile-api.avax-test.network/schema.json'

const TOKEN_AGGREGATOR_SCHEMA_URL = isCI
  ? 'https://core-token-aggregator.avax.network/schema.json'
  : 'https://core-token-aggregator.avax-test.network/schema.json'

const GLACIER_SCHEMA_URL = isCI
  ? 'https://glacier-api.avax.network/api-json'
  : 'https://glacier-api-dev.avax.network/api-json'

function run(cmd) {
  console.log(`\n> ${cmd}`)
  execSync(cmd, {
    stdio: 'inherit',
    cwd: root
  })
}

function main() {
  console.log('Generating API clients for', isCI ? 'CI' : 'development')
  // ensure output dir
  run('mkdir -p app/utils/apiClient/generated')

  // contracts
  run(
    'typechain --target=ethers-v6 --out-dir app/contracts/openzeppelin ' +
      './node_modules/@openzeppelin/contracts/build/contracts/ERC20.json ' +
      './node_modules/@openzeppelin/contracts/build/contracts/ERC721.json ' +
      './node_modules/@openzeppelin/contracts/build/contracts/ERC1155.json'
  )

  // glacier API
  run(
    `npx openapi-zod-client '${GLACIER_SCHEMA_URL}' ` +
      "-o './app/utils/apiClient/generated/glacierApi.client.ts'"
  )

  // token aggregator API
  run(
    `npx openapi-zod-client '${TOKEN_AGGREGATOR_SCHEMA_URL}' ` +
      "-o './app/utils/apiClient/generated/tokenAggregatorApi.client.ts'"
  )

  // profile API (+ patch script)
  run(
    `npx openapi-zod-client '${PROFILE_SCHEMA_URL}' ` +
      "-o './app/utils/apiClient/generated/profileApi.client.ts'"
  )
  run(
    'node ./app/utils/apiClient/scripts/fixZodIntersections.js ' +
      './app/utils/apiClient/generated/profileApi.client.ts'
  )

  // balance API
  run('npx @hey-api/openapi-ts -f balance-api.config.js')
}

main()
