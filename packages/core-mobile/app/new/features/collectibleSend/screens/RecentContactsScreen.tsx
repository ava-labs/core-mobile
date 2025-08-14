import React, { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import { addRecentContact, Contact } from 'store/addressBook'
import { useContacts } from 'common/hooks/useContacts'
import { RecentContacts } from 'features/send/components/RecentContacts'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNativeTokenWithBalanceByNetwork } from 'features/send/hooks/useNativeTokenWithBalanceByNetwork'
import { useSendSelectedToken } from 'features/send/store'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useCollectibleSend } from 'common/hooks/send/useCollectibleSend'
import { ActivityIndicator, alpha, useTheme, View } from '@avalabs/k2-alpine'
import { useNavigation } from '@react-navigation/native'
import { isAddress } from 'ethers'
import { useSendTransactionCallbacks } from '../hooks/useSendTransactionCallbacks'

export const RecentContactsScreen = (): JSX.Element | null => {
  const {
    theme: { colors }
  } = useTheme()
  const [isSending, setIsSending] = useState(false)
  const { navigate, canGoBack, back } = useRouter()
  const { getState } = useNavigation()
  const { recentAddresses, contacts, accounts } = useContacts()
  const { getNetwork } = useNetworks()
  const fromAddress = useSelector(selectActiveAccount)?.addressC ?? ''
  const [selectedToken] = useSendSelectedToken()
  const { onSuccess, onFailure } = useSendTransactionCallbacks()

  const selectedNetwork = useMemo(() => {
    return getNetwork(selectedToken?.networkChainId)
  }, [selectedToken?.networkChainId, getNetwork])

  const { data: networkFee } = useNetworkFee(selectedNetwork)
  const dispatch = useDispatch()
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
        if (selectedToken === undefined) return

        if (isAddress(toAddress) === false) {
          onFailure(new Error('Invalid address'))
          return
        }
        setIsSending(true)
        const txHash = await send(toAddress)

        onSuccess({
          txHash,
          onDismiss: () => {
            // dismiss recent contacts modal
            canGoBack() && back()
            // dismiss onboarding modal
            const state = getState()
            if (state?.routes.some(route => route.name === 'onboarding')) {
              canGoBack() && back()
            }
            contact?.type &&
              dispatch(addRecentContact({ id: contact.id, type: contact.type }))
          }
        })
      } catch (reason) {
        onFailure(reason)
      } finally {
        setIsSending(false)
      }
    },
    [
      back,
      canGoBack,
      dispatch,
      getState,
      onFailure,
      onSuccess,
      selectedToken,
      send
    ]
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
    // @ts-ignore TODO: make routes typesafe
    navigate('/collectibleSend/scanQrCode')
  }, [navigate])

  const handleSumbitEditing = useCallback(
    (text: string): void => {
      handleSend(text)
    },
    [handleSend]
  )

  return (
    <>
      <RecentContacts
        recentAddresses={recentAddresses}
        contacts={collectiblesContacts}
        onGoToQrCode={handleGoToQrCode}
        onSelectContact={goToApproval}
        onSubmitEditing={handleSumbitEditing}
      />
      {isSending && (
        <View
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: alpha(colors.$surfaceSecondary, 0.5),
            zIndex: 1
          }}>
          <ActivityIndicator size="small" />
        </View>
      )}
    </>
  )
}
