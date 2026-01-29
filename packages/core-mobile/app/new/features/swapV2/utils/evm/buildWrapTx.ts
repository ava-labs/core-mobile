import { Contract } from 'ethers'
import { WrapUnwrapTxParams } from '../../types'

export const buildWrapTx = async ({
  userAddress,
  tokenAddress,
  amount,
  provider,
  abi
}: WrapUnwrapTxParams): Promise<{
  to: string
  data: string
  from: string
  value: string
}> => {
  const contract = new Contract(tokenAddress, abi, provider)

  if (!contract.deposit) {
    throw new Error('Deposit method not found on contract')
  }

  const { to, data } = await contract.deposit.populateTransaction()

  return {
    to,
    data,
    from: userAddress,
    value: `0x${BigInt(amount).toString(16)}`
  }
}
