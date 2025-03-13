import { CoingeckoId } from 'store/watchlist'

export interface TokenSubscriptionPayload {
  tokenIds: CoingeckoId[] // List of token addresses to subscribe to
}

export interface ITokenChangeNotificationService {
  setTokenSubscriptions(payload: TokenSubscriptionPayload): Promise<void>
}
