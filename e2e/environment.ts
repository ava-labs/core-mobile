export {}

const {
  DetoxCircusEnvironment,
  SpecReporter,
  WorkerAssignReporter
} = require('detox/runners/jest-circus')

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(
    config: never,
    context: { testPath: string; docblockPragmas: string }
  ) {
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

  async setup() {
    await super.setup()
    this.global.testPaths = this.testPath
  }

  async handleTestEvent(event: { test: unknown; name: string }) {
    const { name } = event
    const test = event.test
    if ('test_fn_failure'.includes(name)) {
      this.global.testResults = ['fail']
    } else if ('test_fn_success'.includes(name)) {
      this.global.testResults = ['pass']
    }
    if ('test_done'.includes(name)) {
      this.global.testNames = test.parent.name

      // console.log(inspect(test.parent.name) + ' this is the test!')
    }
    if ('run_finish'.includes(name)) {
      this.global.testPaths = this.testPath
      // console.log(this.global.testResults + ' this is the test result!')
      // console.log(this.global.testPaths + ' this is the test path!')
    }
  }
}

module.exports = CustomDetoxEnvironment
