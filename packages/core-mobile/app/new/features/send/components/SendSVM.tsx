import React from 'react'
import useSVMSend from 'common/hooks/send/useSVMSend'
import { Network } from '@avalabs/core-chains-sdk'
import { TokenWithBalanceSVM } from '@avalabs/vm-module-types'
import { Account } from 'store/account'
import { useSendContext } from '../context/sendContext'
import { useSendSelectedToken } from '../store'
import { SendToken } from './SendToken'

export const SendSVM = ({
  nativeToken,
  network,
  account,
  onSuccess,
  onFailure
}: {
  nativeToken: TokenWithBalanceSVM
  network: Network
  account: Account
  onSuccess: (txHash: string) => void
  onFailure: (txError: unknown) => void
}): JSX.Element => {
  const { maxFee } = useSendContext()
  const [selectedToken] = useSendSelectedToken()
  const fromAddress = '52C9T2T7JRojtxumYnYZhyUmrN7kqzvCLc4Ksvjk7TxD'

  const { send } = useSVMSend({
    fromAddress,
    network,
    maxFee,
    nativeToken,
    account
  })

  const handleSend = async (): Promise<void> => {
    if (selectedToken === undefined) {
      return
    }

    try {
      const txHash = await send()

      onSuccess(txHash)
    } catch (error) {
      onFailure(error)
    }
  }

  return <SendToken onSend={handleSend} />
}
