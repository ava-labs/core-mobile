// https://github.com/lint-staged/lint-staged#eslint--7-1
// note: we have to pass in an instance of eslint so that the correct eslint 
// from the package is used. otherwise, the eslint from the root package will be used (which doesn't exist)
const generateLintStagedConfig = (eslint) => {
  const removeIgnoredFiles = async files => {
    const ignoredFiles = await Promise.all(
      files.map(file => eslint.isPathIgnored(file))
    )
    const filteredFiles = files.filter((_, i) => !ignoredFiles[i])
    return filteredFiles.join(' ')
  }

  return {
    '*.{js,jsx,ts,tsx}': async files => {
      const filesToLint = await removeIgnoredFiles(files)
      return [`eslint --fix --max-warnings=0 ${filesToLint}`]
    }
  }
}

module.exports = { generateLintStagedConfig }