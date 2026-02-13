// scripts/codegen.js
const { execSync } = require('child_process')
const path = require('path')

const root = path.resolve(__dirname, '..')

function run(cmd) {
  execSync(cmd, {
    stdio: 'inherit',
    cwd: root
  })
}

function main() {
  // ensure output dir
  run('mkdir -p app/utils/api/generated')

  // contracts
  run(
    'typechain --target=ethers-v6 --out-dir app/contracts/openzeppelin ' +
      './node_modules/@openzeppelin/contracts/build/contracts/ERC20.json ' +
      './node_modules/@openzeppelin/contracts/build/contracts/ERC721.json ' +
      './node_modules/@openzeppelin/contracts/build/contracts/ERC1155.json'
  )

  // profile API
  run('npx @hey-api/openapi-ts -f profile-api.config.js')

  // balance API
  run('npx @hey-api/openapi-ts -f balance-api.config.js')

  // Glacier API
  run('npx @hey-api/openapi-ts -f glacier-api.config.js')

  // Token Aggregator API
  run('npx @hey-api/openapi-ts -f aggregator-api.config.js')
}

main()
