import Logger from 'utils/Logger'

export async function subscribeForBalanceChange({
  deviceArn,
  chainIds,
  addresses
}: {
  deviceArn: string
  chainIds: string[]
  addresses: string[]
}): Promise<{ message: 'ok' }> {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deviceArn,
      chainIds,
      addresses
    })
  }

  const response = await fetch(
    'https://core-notification-sender-api.avax-test.network/v1/push/balance-changes/subscribe',
    options
  ).catch(error => {
    Logger.error(
      `[packages/core-mobile/app/services/notifications/subscribe.ts][subscribe]${error}`
    )
    throw new Error(error)
  })
  if (response.ok) {
    return response.json()
  } else {
    throw new Error(`${response.status}:${response.statusText}`)
  }
}
