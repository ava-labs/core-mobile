export {}
// This is needed in case you need to debug the test name
// import { inspect } from 'util'

const { DetoxCircusEnvironment } = require('detox/runners/jest')

type Event = {
  test: { parent: { name: string } }
  name: string
}

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(
    config: never,
    context: { testPath: string; docblockPragmas: string }
  ) {
    super(config, context)
    this.testPath = context.testPath
    this.docblockPragmas = context.docblockPragmas

    // Can be safely removed, if you are content with the default value (=300000ms)
    this.setupTimeout = 120000
  }

  async setup() {
    await super.setup()
    this.global.testPaths = this.testPath
    this.global.testNames = this.testNames
    this.global.testResults = this.testResults
  }

  async handleTestEvent(event: Event, state: unknown) {
    await super.handleTestEvent(event, state)
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
      console.log(this.global.testResults + ' this is the test result!')
      console.log(this.global.testPaths + ' this is the test path!')
    }
  }
}

module.exports = CustomDetoxEnvironment
