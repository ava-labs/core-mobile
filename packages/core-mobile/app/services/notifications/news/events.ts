import { NewsEvents } from 'services/fcm/types'
import { ChannelId } from '../channels'

export const channelIdToNewsEventMap = {
  [ChannelId.PRODUCT_ANNOUNCEMENTS]: NewsEvents.PRODUCT_ANNOUNCEMENTS,
  [ChannelId.OFFERS_AND_PROMOTIONS]: NewsEvents.OFFERS_AND_PROMOTIONS,
  [ChannelId.MARKET_NEWS]: NewsEvents.MARKET_NEWS,
  [ChannelId.PRICE_ALERTS]: NewsEvents.PRICE_ALERTS
}
