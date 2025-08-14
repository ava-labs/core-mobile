import React, { useCallback } from 'react'
import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Logger from 'utils/Logger'
import BiometricsSDK from 'utils/BiometricsSDK'
import WalletService from 'services/wallet/WalletService'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { Network } from '@avalabs/core-chains-sdk'
import { useSelector } from 'react-redux'
import { selectWalletById } from 'store/wallet/slice'
import { WalletType } from 'services/wallet/types'

const VerifyPinForPrivateKeyScreen = (): JSX.Element => {
  const { replace } = useRouter()
  const { walletId, accountIndex } = useLocalSearchParams<{
    walletId: string
    accountIndex: string
  }>()
  const cChainNetwork = useCChainNetwork()
  const wallet = useSelector(selectWalletById(walletId))

  const getPrivateKeyFromMnemonic = useCallback(
    async (mnemonic: string, network: Network): Promise<string> => {
      return WalletService.getPrivateKeyFromMnemonic(
        mnemonic,
        network,
        parseInt(accountIndex)
      )
    },
    [accountIndex]
  )

  const handleLoginSuccess = useCallback(async (): Promise<void> => {
    if (!wallet) {
      Logger.error('Wallet not found for ID:', walletId)
      return
    }

    const walletSecretResult = await BiometricsSDK.loadWalletSecret(wallet.id)
    if (!walletSecretResult.success) {
      Logger.error('Failed to load wallet secret', walletSecretResult.error)
      return
    }
    const walletSecret = walletSecretResult.value
    Logger.info('walletSecret', walletSecret)
    if (wallet.type === WalletType.PRIVATE_KEY) {
      replace({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/accountSettings/viewPrivateKey',
        params: { privateKey: walletSecret }
      })
    } else if (wallet.type === WalletType.MNEMONIC) {
      if (!cChainNetwork) {
        Logger.error('CChain network is not available')
        return
      }
      // Todo: support private key for x/p network later
      getPrivateKeyFromMnemonic(walletSecret, cChainNetwork)
        .then(privateKey => {
          replace({
            // @ts-ignore TODO: make routes typesafe
            pathname: '/accountSettings/viewPrivateKey',
            params: { privateKey }
          })
        })
        .catch(error => {
          Logger.error('Error getting private key from mnemonic', error)
        })
    }
  }, [wallet, walletId, replace, cChainNetwork, getPrivateKeyFromMnemonic])

  return <VerifyWithPinOrBiometry onVerifySuccess={handleLoginSuccess} />
}

export default VerifyPinForPrivateKeyScreen
