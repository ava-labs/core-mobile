import React, { useMemo } from 'react'
import { TokenWithBalanceBTC } from '@avalabs/vm-module-types'
import { Account } from 'store/account'
import { Network } from '@avalabs/core-chains-sdk'
import useBTCSend from 'common/hooks/send/useBTCSend'
import { MINIMUM_SATOSHI_SEND_AMOUNT } from 'consts/amount'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSendSelectedToken } from '../store'
import { useSendContext } from '../context/sendContext'
import { SendToken } from './SendToken'

export const SendBTC = ({
  nativeToken,
  network,
  account,
  onSuccess,
  onFailure
}: {
  nativeToken: TokenWithBalanceBTC
  network: Network
  account: Account
  onSuccess: (txHash: string) => void
  onFailure: (txError: unknown) => void
}): JSX.Element => {
  const { maxFee } = useSendContext()
  const [selectedToken] = useSendSelectedToken()
  const fromAddress = account.addressBTC

  const { send } = useBTCSend({
    fromAddress,
    isMainnet: !network.isTestnet,
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

  const minimumSendAmount = useMemo((): TokenUnit => {
    return new TokenUnit(
      MINIMUM_SATOSHI_SEND_AMOUNT,
      nativeToken.decimals,
      nativeToken.symbol
    )
  }, [nativeToken.decimals, nativeToken.symbol])

  return <SendToken onSend={handleSend} minimumSendAmount={minimumSendAmount} />
}
