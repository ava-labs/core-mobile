import React, { useCallback, useMemo, useEffect } from 'react'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { Contact } from 'store/addressBook'
import { useContacts } from 'common/hooks/useContacts'
import { RecentContacts } from 'features/send/components/RecentContacts'
import { useCollectiblesContext } from 'features/portfolio/collectibles/CollectiblesContext'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import useEVMSend from 'screens/send/hooks/useEVMSend'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useNativeTokenWithBalanceByNetwork } from 'features/send/hooks/useNativeTokenWithBalanceByNetwork'
import { useSendContext } from 'features/send/context/sendContext'

export const RecentContactsScreen = (): JSX.Element | null => {
  const { navigate } = useRouter()
  const { localId } = useGlobalSearchParams<{ localId: string }>()
  const { recentAddresses, contacts, accounts } = useContacts()
  const { getCollectible } = useCollectiblesContext()
  const { getNetwork } = useNetworks()
  const fromAddress = useSelector(selectActiveAccount)?.addressC ?? ''
  const { setToAddress, addressToSend } = useSendContext()

  const collectible = useMemo(() => {
    return getCollectible(localId)
  }, [getCollectible, localId])

  const selectedNetwork = useMemo(() => {
    return getNetwork(collectible?.chainId)
  }, [collectible?.chainId, getNetwork])

  const { data: networkFee } = useNetworkFee(selectedNetwork)
  const nativeToken = useNativeTokenWithBalanceByNetwork(selectedNetwork)

  const { send } = useEVMSend({
    chainId: collectible?.chainId,
    fromAddress,
    network: selectedNetwork,
    maxFee: networkFee?.low.maxFeePerGas,
    nativeToken
  })

  const collectiblesContacts = useMemo(() => {
    const evmContacts = contacts.filter(
      contact => contact.address !== undefined
    )
    return [...evmContacts, ...accounts]
  }, [accounts, contacts])

  const goToApproval = useCallback(
    (contact: Contact): void => {
      setToAddress({ to: contact.id, recipientType: 'contact' })
    },
    [setToAddress]
  )

  const handleGoToQrCode = useCallback((): void => {
    navigate('/collectiblesSend/scanQrCode')
  }, [navigate])

  const handleSumbitEditing = useCallback(
    (text: string): void => {
      setToAddress({ to: text, recipientType: 'address' })
    },
    [setToAddress]
  )

  useEffect(() => {
    if (
      addressToSend === undefined ||
      collectible?.chainId === undefined ||
      fromAddress === undefined ||
      nativeToken === undefined ||
      networkFee === undefined ||
      selectedNetwork === undefined
    ) {
      return
    }
    send()
  }, [
    addressToSend,
    collectible,
    fromAddress,
    nativeToken,
    networkFee,
    selectedNetwork,
    send
  ])

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
