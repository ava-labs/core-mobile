// scripts/codegen.js
const { execSync } = require('child_process')
const path = require('path')

const root = path.resolve(__dirname, '..')

const isCI = process.env.APP_ENV === 'ci'

if (!isCI) {
  delete process.env.SSL_CERT_FILE
  delete process.env.SSL_CERT_DIR
}

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
    'npx typechain --target=ethers-v6 --out-dir app/contracts/openzeppelin ' +
      './node_modules/@openzeppelin/contracts/build/contracts/ERC20.json ' +
      './node_modules/@openzeppelin/contracts/build/contracts/ERC721.json ' +
      './node_modules/@openzeppelin/contracts/build/contracts/ERC1155.json'
  )

  // Use the locally-installed openapi-ts binary rather than `npx`, which would
  // resolve the tool in an isolated sandbox without its `typescript` peer and
  // pull in an incompatible TypeScript (crashing on `ts.NewLineKind`).
  const openapiTs = path.join(root, 'node_modules', '.bin', 'openapi-ts')

  // profile API
  run(`${openapiTs} -f profile-api.config.js`)

  // balance API
  run(`${openapiTs} -f balance-api.config.js`)

  // Glacier API
  run(`${openapiTs} -f glacier-api.config.js`)

  // Token Aggregator API
  run(`${openapiTs} -f aggregator-api.config.js`)
}

main()
