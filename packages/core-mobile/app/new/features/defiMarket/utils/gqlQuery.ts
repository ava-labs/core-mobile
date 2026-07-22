/**
 * A naive implementation of a GraphQL client.
 * @param url - GQL endpoint
 * @param query - GQL document string - no gql tagging necessary
 * @param variables - variables to accompany query
 */
export async function gqlQuery(
  url: string,
  query: string,
  variables: object = {}
): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  })

  if (!response.ok) {
    // React Native's fetch returns an empty statusText, so include the
    // status code — otherwise the error reads "GraphQL error: " and a 429
    // is indistinguishable from a 500.
    throw new Error(
      `GraphQL error: HTTP ${response.status}${
        response.statusText ? ` ${response.statusText}` : ''
      }`
    )
  }

  return response.json()
}
