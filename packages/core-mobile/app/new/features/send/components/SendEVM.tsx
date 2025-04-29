import React from 'react'
import { NetworkTokenWithBalance } from '@avalabs/vm-module-types'
import useEVMSend from 'common/hooks/send/useEVMSend'
import { Account } from 'store/account'
import { Network } from '@avalabs/core-chains-sdk'
import { useSendSelectedToken } from '../store'
import { useSendContext } from '../context/sendContext'
import { SendToken } from './SendToken'

export const SendEVM = ({
  nativeToken,
  network,
  account,
  onSuccess,
  onFailure
}: {
  nativeToken: NetworkTokenWithBalance
  network: Network
  account: Account
  onSuccess: (txHash: string) => void
  onFailure: (txError: unknown) => void
}): JSX.Element => {
  const { maxFee } = useSendContext()
  const [selectedToken] = useSendSelectedToken()
  const fromAddress = account.addressC

  const { send } = useEVMSend({
    chainId: network.chainId,
    fromAddress,
    network,
    maxFee,
    nativeToken
  })

  const handleSend = async (): Promise<void> => {
    if (selectedToken === undefined) {
      return
    }

    try {
      const txHash = await send()

      onSuccess(txHash)
    } catch (reason) {
      onFailure(reason)
    }
  }

  return <SendToken onSend={handleSend} />
}
