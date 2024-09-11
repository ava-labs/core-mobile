import { object, string } from 'zod'

export const NotificationsBalanceChangeSchema = object({
  data: object({
    accountAddress: string().startsWith('0x'),
    chainId: string(),
    event: string(),
    transactionHash: string().startsWith('0x')
  }),
  notification: object({
    title: string(),
    body: string()
  })
})

export enum BalanceChangeEvents {
  BALANCES_SPENT = 'BALANCES_SPENT',
  BALANCES_RECEIVED = 'BALANCES_RECEIVED',
  ALLOWANCE_APPROVED = 'ALLOWANCE_APPROVED'
}
