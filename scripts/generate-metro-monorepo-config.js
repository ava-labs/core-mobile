// https://gist.github.com/GingerBear/485f922a1e403739dc56d279925b216d
// https://github.com/facebook/metro/issues/1#issuecomment-334546083
/**
 * check symlink packages and their peer dependencies
 * and generate metro.config.js accordingly
 */
const path = require('path')
const fs = require('fs')

const METRO_CONFIG_NAME = 'metro.monorepo.config.js'
const AVALABS_SCOPE = '@avalabs'
const PACKAGES_TO_PROCESS = ['k2-alpine', 'react-native-nitro-avalabs-crypto']
const CWD = process.cwd()

function getSymlinkedDependenciesPaths() {
  const nodeModulesPath = path.join(CWD, 'node_modules')

  const results = []

  // handle scoped packages under @avalabs/*
  const avalabsPath = path.join(nodeModulesPath, AVALABS_SCOPE)
  if (fs.existsSync(avalabsPath)) {
    const scopedDeps = fs.readdirSync(avalabsPath)

    scopedDeps.forEach(dep => {
      if (!PACKAGES_TO_PROCESS.includes(dep)) return

      const fullPath = path.join(avalabsPath, dep)
      if (fs.lstatSync(fullPath).isSymbolicLink()) {
        results.push(fs.realpathSync(fullPath))
      }
    })
  }

  // handle unscoped packages in node_modules/*
  PACKAGES_TO_PROCESS.forEach(pkg => {
    // skip packages that belong to @avalabs scope — already processed
    if (pkg.startsWith('@avalabs/')) return

    const pkgPath = path.join(nodeModulesPath, pkg)
    if (fs.existsSync(pkgPath) && fs.lstatSync(pkgPath).isSymbolicLink()) {
      results.push(fs.realpathSync(pkgPath))
    }
  })

  return results
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

  // Metro 0.83+ uses package "exports", so importing internal paths like
  // \`metro-config/src/defaults/exclusionList\` throws \`ERR_PACKAGE_PATH_NOT_EXPORTED\`.
  // Inline Metro's exclusionList implementation to keep this generated config stable.
  const escapeRegExp = pattern => {
    if (pattern instanceof RegExp) {
      return pattern.source.replace(/\\/|\\\\\\//g, '\\\\' + path.sep)
    } else if (typeof pattern === 'string') {
      const escaped = pattern.replace(/[\\-\\[\\]\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|]/g, '\\\\$&')
      return escaped.replaceAll('/', '\\\\' + path.sep)
    }
    throw new Error(
      \`Expected exclusionList to be called with RegExp or string, got: \${typeof pattern}\`
    )
  }

  const exclusionList = additionalExclusions => {
    const base = [/\\/__tests__\\/.*/]
    return new RegExp(
      '(' + (additionalExclusions || []).concat(base).map(escapeRegExp).join('|') + ')$'
    )
  }

  module.exports = {
      resolver: {
        // block conflicting dependencies (react native for ex) from other packages in the workspace
        // (Metro calls this \`blockList\`; older configs used \`blacklistRE\`)
        blockList: exclusionList([
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
