import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { Contact } from 'store/addressBook'
import { useContacts } from 'common/hooks/useContacts'
import { RecentContacts } from 'features/send/components/RecentContacts'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNativeTokenWithBalanceByNetwork } from 'features/send/hooks/useNativeTokenWithBalanceByNetwork'
import { useSendSelectedToken } from 'features/send/store'
import { useNetworkFee } from 'hooks/useNetworkFee'
import useCollectibleSend from 'screens/send/hooks/useCollectibleSend'
import { useSuccessOrFailure } from '../hooks/useSuccessOrFailure'

export const RecentContactsScreen = (): JSX.Element | null => {
  const { navigate, canGoBack, back } = useRouter()
  const { recentAddresses, contacts, accounts } = useContacts()
  const { getNetwork } = useNetworks()
  const fromAddress = useSelector(selectActiveAccount)?.addressC ?? ''
  const [selectedToken] = useSendSelectedToken()
  const { onSuccess, onFailure } = useSuccessOrFailure()

  const selectedNetwork = useMemo(() => {
    return getNetwork(selectedToken?.networkChainId)
  }, [selectedToken?.networkChainId, getNetwork])
  const { data: networkFee } = useNetworkFee(selectedNetwork)

  const nativeToken = useNativeTokenWithBalanceByNetwork(selectedNetwork)

  const { send } = useCollectibleSend({
    chainId: selectedToken?.networkChainId,
    fromAddress,
    nativeToken,
    network: selectedNetwork,
    maxFee: networkFee?.low.maxFeePerGas
  })

  const handleSend = useCallback(
    async (toAddress: string, contact?: Contact): Promise<void> => {
      try {
        const txHash = await send(toAddress)

        onSuccess({
          txHash,
          contact,
          onDismiss: () => {
            // dismiss recent contacts modal
            canGoBack() && back()
          }
        })
      } catch (reason) {
        onFailure(reason)
      }
    },
    [back, canGoBack, onFailure, onSuccess, send]
  )

  const collectiblesContacts = useMemo(() => {
    const evmContacts = contacts.filter(
      contact => contact.address !== undefined
    )
    return [...evmContacts, ...accounts]
  }, [accounts, contacts])

  const goToApproval = useCallback(
    (contact: Contact): void => {
      contact.address && handleSend(contact.address, contact)
    },
    [handleSend]
  )

  const handleGoToQrCode = useCallback((): void => {
    navigate('/collectiblesSend/scanQrCode')
  }, [navigate])

  const handleSumbitEditing = useCallback(
    (text: string): void => {
      handleSend(text)
    },
    [handleSend]
  )

  return (
    <RecentContacts
      recentAddresses={recentAddresses}
      contacts={collectiblesContacts}
      onGoToQrCode={handleGoToQrCode}
      onSelectContact={goToApproval}
      onSubmitEditing={handleSumbitEditing}
    />
  )
}
