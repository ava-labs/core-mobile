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
    throw new Error(`GraphQL error: ${response.statusText}`)
  }

  return response.json()
}
