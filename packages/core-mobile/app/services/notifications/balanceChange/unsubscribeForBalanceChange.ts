import Logger from 'utils/Logger'

export async function unSubscribeForBalanceChange({
  deviceArn
}: {
  deviceArn: string
}): Promise<{ message: 'ok' }> {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deviceArn
    })
  }

  const response = await fetch(
    'https://core-notification-sender-api.avax-test.network/v1/push/balance-changes/unsubscribe',
    options
  ).catch(error => {
    Logger.error(`[unsubscribeForBalanceChange.ts][unsubscribe]${error}`)
    throw error
  })
  if (response.ok) {
    return response.json()
  } else {
    throw new Error(`${response.status}:${response.statusText}`)
  }
}
