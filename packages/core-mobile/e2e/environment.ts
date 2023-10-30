export {}

const { DetoxCircusEnvironment } = require('detox/runners/jest')

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(
    config: never,
    context: { testPath: string; docblockPragmas: string }
  ) {
    super(config, context)

    // Can be safely removed, if you are content with the default value (=300000ms)
    this.setupTimeout = 120000
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async setup(config: any, context: any) {
    await super.setup(config, context)
  }
}

module.exports = CustomDetoxEnvironment
