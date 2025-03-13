import Logger from 'utils/Logger'
import {
  ITokenChangeNotificationService,
  TokenSubscriptionPayload
} from './types'

export class TokenChangeNotificationService
  implements ITokenChangeNotificationService
{
  async setTokenSubscriptions(
    payload: TokenSubscriptionPayload
  ): Promise<void> {
    // TODO: Implement actual API call when the endpoint is available
    Logger.warn('Setting token subscriptions:', payload.tokenIds)
  }
}

export const tokenChangeNotificationService =
  new TokenChangeNotificationService()
