import { server } from './node/server'

// polyfill "fetch"
global.fetch = require('node-fetch').default

// establish API mocking before all tests.
beforeAll(() => {
  server.listen()
})

// reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers())

// clean up after the tests are finished.
afterAll(() => server.close())
