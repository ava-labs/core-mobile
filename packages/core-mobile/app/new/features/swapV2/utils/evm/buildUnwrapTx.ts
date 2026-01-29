import { Contract } from 'ethers'
import { WrapUnwrapTxParams } from '../../types'

export const buildUnwrapTx = async ({
  userAddress,
  tokenAddress,
  amount,
  provider,
  abi
}: WrapUnwrapTxParams): Promise<{
  to: string
  data: string
  from: string
}> => {
  const contract = new Contract(tokenAddress, abi, provider)

  if (!contract.withdraw) {
    throw new Error('Withdraw method not found on contract')
  }

  const { to, data } = await contract.withdraw.populateTransaction(
    `0x${BigInt(amount).toString(16)}`
  )

  return {
    to,
    data,
    from: userAddress
  }
}
