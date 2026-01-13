import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { router } from 'expo-router'
import { Network } from '@avalabs/core-chains-sdk'
import { showAlert } from '@avalabs/k2-alpine'

export const showLedgerReviewTransaction = async ({
  network,
  onApprove,
  onReject
}: {
  network: Network
  onApprove: () => Promise<void>
  onReject: (message?: string) => void
}): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    walletConnectCache.ledgerReviewTransactionParams.set({
      network,
      onApprove: () =>
        onApprove()
          .then(() => resolve(''))
          .catch(error => {
            showAlert({
              title: 'Error',
              description: error.message,
              buttons: [{ text: 'OK', onPress: () => reject(error) }]
            })
            reject(error)
          }),
      onReject: (message?: string) => {
        onReject(message)
        reject(message)
      }
    })
    setTimeout(() => {
      // @ts-ignore TODO: make routes typesafe
      router.navigate('/ledgerReviewTransaction')
    }, 100)
  })
}
