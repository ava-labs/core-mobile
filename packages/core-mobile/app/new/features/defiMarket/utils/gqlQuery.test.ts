import { gqlQuery } from './gqlQuery'

const mockFetchResponse = (response: Partial<Response>): void => {
  jest.spyOn(global, 'fetch').mockResolvedValue(response as unknown as Response)
}

describe('gqlQuery', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns the parsed json on success', async () => {
    mockFetchResponse({
      ok: true,
      json: () => Promise.resolve({ data: { markets: [] } })
    })

    await expect(
      gqlQuery('https://example.com/gql', '{ markets }')
    ).resolves.toEqual({
      data: { markets: [] }
    })
  })

  it('includes the http status in the error on non-ok responses', async () => {
    // React Native's fetch returns an empty statusText, so the status code
    // is the only signal that distinguishes a 429 from a 500 in Sentry.
    mockFetchResponse({
      ok: false,
      status: 429,
      statusText: ''
    })

    await expect(
      gqlQuery('https://example.com/gql', '{ markets }')
    ).rejects.toThrow('GraphQL error: HTTP 429')
  })

  it('appends statusText when the platform provides one', async () => {
    mockFetchResponse({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable'
    })

    await expect(
      gqlQuery('https://example.com/gql', '{ markets }')
    ).rejects.toThrow('GraphQL error: HTTP 503 Service Unavailable')
  })
})
