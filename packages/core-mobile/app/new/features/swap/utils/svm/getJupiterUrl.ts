const JUPITER_BASE_URL = 'https://lite-api.jup.ag/swap/v1'

export const getJupiterUrl = (
  path: string,
  queryParams?: URLSearchParams
): string => {
  const queryString =
    queryParams !== undefined ? `?${queryParams.toString()}` : ''

  return `${JUPITER_BASE_URL}/${path}${queryString}`
}
