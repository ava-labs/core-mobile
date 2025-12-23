// scripts/codegen.js
const { execSync } = require('child_process')
const path = require('path')

const root = path.resolve(__dirname, '..')

const isCI = process.env.APP_ENV === 'ci'

const PROFILE_SCHEMA_URL = isCI
  ? 'https://core-profile-api.avax.network/schema.json'
  : 'https://core-profile-api.avax-test.network/schema.json'

function run(cmd) {
  execSync(cmd, {
    stdio: 'inherit',
    cwd: root
  })
}

function main() {
  // ensure output dir
  run('mkdir -p app/utils/apiClient/generated')

  // contracts
  run(
    'typechain --target=ethers-v6 --out-dir app/contracts/openzeppelin ' +
      './node_modules/@openzeppelin/contracts/build/contracts/ERC20.json ' +
      './node_modules/@openzeppelin/contracts/build/contracts/ERC721.json ' +
      './node_modules/@openzeppelin/contracts/build/contracts/ERC1155.json'
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

  // Glacier API
  run('npx @hey-api/openapi-ts -f glacier-api.config.js')

  // Token Aggregator API
  run('npx @hey-api/openapi-ts -f aggregator-api.config.js')
}

main()
