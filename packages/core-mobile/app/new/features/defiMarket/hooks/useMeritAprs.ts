import { useQuery } from '@tanstack/react-query'
import { AAVE_CHAN_MERIT_API_URL } from '../consts'
import { aaveMeritAprSchema } from '../schema'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useMeritAprs = () => {
  return useQuery({
    queryKey: ['aaveMeritAprs'],
    queryFn: async () => {
      const response = await fetch(`${AAVE_CHAN_MERIT_API_URL}/aprs`, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch Aave Chan Merit APRs')
      }

      const responseJson = await response.json()
      const parsedResponse = aaveMeritAprSchema.safeParse(responseJson)
      return parsedResponse.success
        ? parsedResponse.data.currentAPR.actionsAPR
        : {
            'avalanche-supply-ausd': 0,
            'avalanche-supply-btcb': 0,
            'avalanche-supply-gho': 0,
            'avalanche-supply-savax': 0,
            'avalanche-supply-usdc': 0,
            'avalanche-supply-usdt': 0
          }
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}
