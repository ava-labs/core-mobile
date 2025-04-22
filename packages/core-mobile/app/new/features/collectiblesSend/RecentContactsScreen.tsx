import React, { useCallback, useMemo, useEffect } from 'react'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { addRecentContact, Contact } from 'store/addressBook'
import { useContacts } from 'common/hooks/useContacts'
import { RecentContacts } from 'features/send/components/RecentContacts'
import { useCollectiblesContext } from 'features/portfolio/collectibles/CollectiblesContext'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNativeTokenWithBalanceByNetwork } from 'features/send/hooks/useNativeTokenWithBalanceByNetwork'
import { useSendSelectedToken } from 'features/send/store'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useNavigation } from '@react-navigation/native'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { showSnackbar } from 'common/utils/toast'
import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage/getJsonRpcErrorMessage'
import useCollectibleSend from '../../../screens/send/hooks/useCollectibleSend'

export const RecentContactsScreen = (): JSX.Element | null => {
  const { navigate, canGoBack, back } = useRouter()
  const { localId } = useGlobalSearchParams<{ localId: string }>()
  const { recentAddresses, contacts, accounts } = useContacts()
  const { getCollectible } = useCollectiblesContext()
  const { getNetwork } = useNetworks()
  const { getState } = useNavigation()
  const dispatch = useDispatch()
  const fromAddress = useSelector(selectActiveAccount)?.addressC ?? ''
  const [_, setSelectedToken] = useSendSelectedToken()

  const collectible = useMemo(() => {
    return getCollectible(localId)
  }, [getCollectible, localId])

  useEffect(() => {
    if (collectible) {
      setSelectedToken(collectible)
    }
  }, [collectible, setSelectedToken])

  const selectedNetwork = useMemo(() => {
    return getNetwork(collectible?.networkChainId)
  }, [collectible?.networkChainId, getNetwork])

  const nativeToken = useNativeTokenWithBalanceByNetwork(selectedNetwork)

  const handleSuccess = useCallback(
    (txHash: string, contact?: Contact): void => {
      selectedNetwork &&
        AnalyticsService.captureWithEncryption('SendTransactionSucceeded', {
          chainId: selectedNetwork.chainId,
          txHash
        })
      audioFeedback(Audios.Send)
      setSelectedToken(undefined)
      contact?.type &&
        dispatch(addRecentContact({ id: contact.id, type: contact.type }))

      canGoBack() && back()
      // dismiss recent contacts modal
      const navigationState = getState()
      if (
        navigationState?.routes[navigationState?.index ?? 0]?.name ===
        'recentContacts'
      ) {
        canGoBack() && back()
      }
    },
    [back, canGoBack, dispatch, getState, selectedNetwork, setSelectedToken]
  )

  const handleFailure = useCallback(
    (error: unknown): void => {
      if (error instanceof Error && !isUserRejectedError(error)) {
        showSnackbar(getJsonRpcErrorMessage(error))
        selectedNetwork &&
          AnalyticsService.capture('SendTransactionFailed', {
            errorMessage: error.message,
            chainId: selectedNetwork.chainId
          })
      }
    },
    [selectedNetwork]
  )

  const { send } = useCollectibleSend({
    chainId: collectible?.networkChainId,
    fromAddress,
    nativeToken
  })

  const handleSend = useCallback(
    async (toAddress: string, contact?: Contact): Promise<void> => {
      try {
        const txHash = await send(toAddress)

        handleSuccess(txHash, contact)
      } catch (reason) {
        handleFailure(reason)
      }
    },
    [handleFailure, handleSuccess, send]
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
