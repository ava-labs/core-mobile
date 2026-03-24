import React from 'react'
import { TokenWithBalanceAVM } from '@avalabs/vm-module-types'
import { Network } from '@avalabs/core-chains-sdk'
import useAVMSend from 'common/hooks/send/useAVMSend'
import type { AvmCapableAccount } from 'common/hooks/send/utils/types'
import { useSendSelectedToken } from '../store'
import { useSendContext } from '../context/sendContext'
import { SendToken } from './SendToken'

export const SendAVM = ({
  nativeToken,
  network,
  account,
  onSuccess,
  onFailure
}: {
  nativeToken: TokenWithBalanceAVM
  network: Network
  account: AvmCapableAccount
  onSuccess: (txHash: string) => void
  onFailure: (txError: unknown) => void
}): JSX.Element => {
  const { maxFee } = useSendContext()
  const [selectedToken] = useSendSelectedToken()

  const { send } = useAVMSend({
    fromAddress: account.addressAVM,
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
    } catch (reason) {
      onFailure(reason)
    }
  }

  return <SendToken onSend={handleSend} />
}
