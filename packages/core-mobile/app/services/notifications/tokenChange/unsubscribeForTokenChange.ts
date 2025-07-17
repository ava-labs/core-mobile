import { setTokenChangeSubscriptions } from 'services/notifications/tokenChange/setTokenChangeSubscriptions'

export async function unsubscribeForTokenChange({
  deviceArn
}: {
  deviceArn: string
}): Promise<void> {
  await setTokenChangeSubscriptions({ tokens: [], deviceArn })
}
