import { object, string } from 'zod'

export const NotificationsBalanceChangeSchema = object({
  data: object({
    accountAddress: string().startsWith('0x'),
    chainId: string(),
    transactionHash: string().startsWith('0x')
  }),
  notification: object({
    title: string(),
    body: string()
  })
})
