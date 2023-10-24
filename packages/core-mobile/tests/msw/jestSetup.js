import fetch, { Headers, Request, Response } from 'node-fetch'
import { server } from './node/server'

// polyfill "fetch"
if (!global.fetch) {
  global.fetch = fetch
  global.Headers = Headers
  global.Request = Request
  global.Response = Response
}

// establish API mocking before all tests.
beforeAll(() => {
  server.listen()
})

// reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers())

// clean up after the tests are finished.
afterAll(() => server.close())

// mock Logger to make console output less noisy
jest.mock('utils/Logger')
