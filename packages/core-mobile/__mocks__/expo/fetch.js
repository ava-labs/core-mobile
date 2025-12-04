// Simple mock that behaves like global fetch
const mockFetch = jest.fn(async () => {
  return {
    ok: true,
    status: 200,
    json: async () => ({}),

    // For streaming reader
    body: {
      getReader() {
        return {
          async read() {
            return { done: true, value: undefined }
          },
          releaseLock() {
            // do nothing
          }
        }
      }
    }
  }
})

module.exports = {
  fetch: mockFetch,
  __esModule: true
}
