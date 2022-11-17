// eslint-disable-next-line prettier/prettier
export { }

const {
  DetoxCircusEnvironment,
  SpecReporter,
  WorkerAssignReporter
} = require('detox/runners/jest-circus')

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config: unknown, context: unknown) {
    super(config, context)
    this.testPath = context.testPath
    this.docblockPragmas = context.docblockPragmas

    // Can be safely removed, if you are content with the default value (=300000ms)
    this.initTimeout = 300000

    // This takes care of generating status logs on a per-spec basis. By default, Jest only reports at file-level.
    // This is strictly optional.
    this.registerListeners({
      SpecReporter,
      WorkerAssignReporter
    })
  }

  getNames(parent) {
    if (!parent) {
      return []
    }

    if (parent.name === 'ROOT_DESCRIBE_BLOCK') {
      return []
    }

    const parentName = this.getNames(parent.parent)
    return [...parentName, parent.name]
  }

  async handleTestEvent(event) {
    const { name } = event
    if ('test_fn_failure'.includes(name)) {
      this.global.testResults = ['fail']
    } else if ('test_fn_success'.includes(name)) {
      this.global.testResults = ['pass']
    }
    if (['run_start', 'test_fn_start'].includes(name)) {
      this.global.testNames = this.getNames(event.test)
    }
    if ('run_finish'.includes(name)) {
      console.log(this.global.testResults + ' this is the test result!')
    }
  }
}

module.exports = CustomDetoxEnvironment
