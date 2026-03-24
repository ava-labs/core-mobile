import React from 'react'
import { TokenWithBalancePVM } from '@avalabs/vm-module-types'
import usePVMSend from 'common/hooks/send/usePVMSend'
import type { PvmCapableAccount } from 'common/hooks/send/utils/types'
import { Network } from '@avalabs/core-chains-sdk'
import { useSendSelectedToken } from '../store'
import { useSendContext } from '../context/sendContext'
import { SendToken } from './SendToken'

export const SendPVM = ({
  nativeToken,
  network,
  account,
  onSuccess,
  onFailure
}: {
  nativeToken: TokenWithBalancePVM
  network: Network
  account: PvmCapableAccount
  onSuccess: (txHash: string) => void
  onFailure: (txError: unknown) => void
}): JSX.Element => {
  const { maxFee } = useSendContext()
  const [selectedToken] = useSendSelectedToken()

  const { send } = usePVMSend({
    network,
    fromAddress: account.addressPVM,
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
    } catch (reason) {
      onFailure(reason)
    }
  }

  return <SendToken onSend={handleSend} />
}
