// https://gist.github.com/GingerBear/485f922a1e403739dc56d279925b216d
// https://github.com/facebook/metro/issues/1#issuecomment-334546083
/**
 * check symlink packages and their peer dependencies
 * and generate metro.config.js accordingly
 */
const path = require('path')
const fs = require('fs')

const METRO_CONFIG_NAME = 'metro.monorepo.config.js'
const AVALABS_ALIAS = '@avalabs'
const PACKAGES_TO_PROCESS = ['k2-alpine', 'react-native-nitro-avalabs-crypto', 'avalabs-nitro-fetch']
const CWD = process.cwd()

function getSymlinkedDependenciesPaths() {
  const symlinkedDependencies = fs
    .readdirSync(`${CWD}/node_modules/${AVALABS_ALIAS}`)
    .filter(dependency => {
      return (
        PACKAGES_TO_PROCESS.includes(dependency) &&
        fs
          .lstatSync(`node_modules/${AVALABS_ALIAS}/${dependency}`)
          .isSymbolicLink()
      )
    })

  return symlinkedDependencies.map(dependency =>
    fs.realpathSync(`node_modules/${AVALABS_ALIAS}/${dependency}`)
  )
}

function getPeerDependencies(symlinkedDependenciesPaths) {
  return (
    symlinkedDependenciesPaths
      .map(item => require(`${item}/package.json`).peerDependencies)
      .map(peerDependencies =>
        peerDependencies ? Object.keys(peerDependencies) : []
      )
      // flatten the array of arrays
      .reduce(
        (flatDependencies, dependencies) => [
          ...flatDependencies,
          ...dependencies
        ],
        []
      )
      // filter to make array elements unique
      .filter(
        (dependency, i, dependencies) => dependencies.indexOf(dependency) === i
      )
  )
}

function generateBlacklist(
  symlinkedDependenciesPaths,
  peerDependenciesOfSymlinkedDependencies
) {
  return symlinkedDependenciesPaths
    .map(p => {
      return peerDependenciesOfSymlinkedDependencies
        .map(peerDependency => {
          return `${peerDependency.replace(/\//g, '[/\\\\]')}`
        })
        .map(formattedPeerDependency => {
          return `/${p.replace(
            /\//g,
            '[/\\\\]'
          )}[/\\\\]node_modules[/\\\\]${formattedPeerDependency}[/\\\\].*/`
        })
    })
    .flat()
}

function generateRnCliConfig(
  symlinkedDependenciesPaths,
  peerDependenciesOfSymlinkedDependencies
) {
  const extraNodeModules = peerDependenciesOfSymlinkedDependencies
    .map(name => `'${name}': path.resolve(__dirname, 'node_modules/${name}')`)
    .join(',\n')

  const blacklistRE = generateBlacklist(
    symlinkedDependenciesPaths,
    peerDependenciesOfSymlinkedDependencies
  )

  const projectRoots = symlinkedDependenciesPaths
    .map(item => `'${path.resolve(item)}'`)
    .join(',\n')

  const fileBody = `
  const path = require('path');
  const blacklist = require('metro-config/src/defaults/exclusionList');

  module.exports = {
      resolver: {
        // blacklist conflicting dependencies (react native for ex) from other packages in the workspace
        blacklistRE: blacklist([
${blacklistRE}
        ]),
        // load conflicting dependencies from current package only
        extraNodeModules: {
${extraNodeModules}
        }
      },
      
      // add workspace root so that metro can find the source code for the included packages in the monorepo
      projectRoot: '${path.resolve(CWD)}',
      
      // include symlinked packages as additional roots
      watchFolders: [${projectRoots}],
  };
  `

  fs.writeFileSync(METRO_CONFIG_NAME, fileBody)
}

function generate() {
  const symlinkedDependenciesPaths = getSymlinkedDependenciesPaths()
  const peerDependenciesOfSymlinkedDependencies = getPeerDependencies(
    symlinkedDependenciesPaths
  )
  generateRnCliConfig(
    symlinkedDependenciesPaths,
    peerDependenciesOfSymlinkedDependencies
  )
}

generate()
