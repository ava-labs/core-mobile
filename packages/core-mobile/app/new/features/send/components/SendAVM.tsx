import React from 'react'
import { TokenWithBalanceAVM } from '@avalabs/vm-module-types'
import { Account } from 'store/account'
import { Network } from '@avalabs/core-chains-sdk'
import useAVMSend from 'common/hooks/send/useAVMSend'
import { CoreAccountType } from '@avalabs/types'
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
  account: Account
  onSuccess: (txHash: string) => void
  onFailure: (txError: unknown) => void
}): JSX.Element => {
  const { maxFee } = useSendContext()
  const [selectedToken] = useSendSelectedToken()
  const fromAddress = account.addressAVM

  if (account.type !== CoreAccountType.PRIMARY) {
    throw new Error('Account is not a primary account')
  }

  const { send } = useAVMSend({
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
    } catch (reason) {
      onFailure(reason)
    }
  }

  return <SendToken onSend={handleSend} />
}
