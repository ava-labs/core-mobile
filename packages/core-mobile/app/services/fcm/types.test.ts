import { ChannelId } from 'services/notifications/channels'
import {
  NotificationPayloadSchema,
  BalanceChangeDataSchema,
  NewsDataSchema,
  NotificationTypes,
  BalanceChangeEvents,
  NewsEvents
} from './types'

describe('NotificationPayloadSchema', () => {
  describe('valid schemas', () => {
    describe('balance change notifications', () => {
      it('validates a complete balance change notification', () => {
        const validBalanceChangePayload = {
          data: {
            type: NotificationTypes.BALANCE_CHANGES,
            event: BalanceChangeEvents.BALANCES_RECEIVED,
            title: 'You received AVAX',
            body: 'You received 5.5 AVAX',
            accountAddress: '0x742d35Cc6634C0532925a3b8D58C5B89FC2A74c0',
            chainId: '43114',
            transactionHash:
              '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            url: 'https://snowtrace.io/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
          },
          notification: {
            title: 'You received AVAX',
            body: 'You received 5.5 AVAX',
            sound: 'default',
            android: {
              channelId: ChannelId.BALANCE_CHANGES
            }
          }
        }

        const result = NotificationPayloadSchema.safeParse(
          validBalanceChangePayload
        )
        expect(result.success).toBe(true)
      })

      it('validates balance change notification without optional notification field', () => {
        const validPayload = {
          data: {
            type: NotificationTypes.BALANCE_CHANGES,
            event: BalanceChangeEvents.BALANCES_SPENT,
            title: 'AVAX spent',
            body: 'You spent 2.1 AVAX',
            accountAddress: '0x742d35Cc6634C0532925a3b8D58C5B89FC2A74c0',
            chainId: '43113',
            transactionHash:
              '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            url: 'https://testnet.snowtrace.io/tx/0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
          }
        }

        const result = NotificationPayloadSchema.safeParse(validPayload)
        expect(result.success).toBe(true)
      })

      it('validates each balance change event type', () => {
        Object.values(BalanceChangeEvents).forEach(event => {
          const payload = {
            data: {
              type: NotificationTypes.BALANCE_CHANGES,
              event,
              title: 'Test title',
              body: 'Test body',
              accountAddress: '0x742d35Cc6634C0532925a3b8D58C5B89FC2A74c0',
              chainId: '43114',
              transactionHash:
                '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
              url: 'https://example.com'
            }
          }

          const result = NotificationPayloadSchema.safeParse(payload)
          expect(result.success).toBe(true)
        })
      })
    })

    describe('news notifications', () => {
      it('validates a complete news notification with urlV2', () => {
        const validNewsPayload = {
          data: {
            type: 'NEWS',
            event: 'PRODUCT_ANNOUNCEMENTS',
            title: 'New Feature Available',
            body: 'Check out our latest staking improvements',
            urlV2: 'core://swap'
          }
        }

        const result = NotificationPayloadSchema.safeParse(validNewsPayload)
        expect(result.success).toBe(true)
      })

      it('validates a complete news notification', () => {
        const validNewsPayload = {
          data: {
            type: NotificationTypes.NEWS,
            event: NewsEvents.PRODUCT_ANNOUNCEMENTS,
            title: 'New Feature Available',
            body: 'Check out our latest staking improvements',
            url: 'https://core.app/news/staking-improvements'
          },
          notification: {
            title: 'New Feature Available',
            body: 'Check out our latest staking improvements',
            sound: 'default',
            android: {
              channelId: ChannelId.PRODUCT_ANNOUNCEMENTS
            }
          }
        }

        const result = NotificationPayloadSchema.safeParse(validNewsPayload)
        expect(result.success).toBe(true)
      })

      it('validates news notification without optional notification field', () => {
        const validPayload = {
          data: {
            type: NotificationTypes.NEWS,
            event: NewsEvents.MARKET_NEWS,
            title: 'Market Update',
            body: 'AVAX price increased by 15%',
            urlV2: 'https://core.app/market/avax'
          }
        }

        const result = NotificationPayloadSchema.safeParse(validPayload)
        expect(result.success).toBe(true)
      })

      it('validates each news event type', () => {
        Object.values(NewsEvents).forEach(event => {
          const payload = {
            data: {
              type: NotificationTypes.NEWS,
              event,
              title: 'Test title',
              body: 'Test body',
              urlV2: 'https://example.com'
            }
          }

          const result = NotificationPayloadSchema.safeParse(payload)
          expect(result.success).toBe(true)
        })
      })
    })

    describe('notification field variations', () => {
      it('validates notification without sound field', () => {
        const payload = {
          data: {
            type: NotificationTypes.NEWS,
            event: NewsEvents.PRICE_ALERTS,
            title: 'Price Alert',
            body: 'AVAX reached $50',
            urlV2: 'https://core.app/price-alerts'
          },
          notification: {
            title: 'Price Alert',
            body: 'AVAX reached $50'
          }
        }

        const result = NotificationPayloadSchema.safeParse(payload)
        expect(result.success).toBe(true)
      })

      it('validates notification without android field', () => {
        const payload = {
          data: {
            type: NotificationTypes.NEWS,
            event: NewsEvents.OFFERS_AND_PROMOTIONS,
            title: 'Special Offer',
            body: 'Limited time promotion available',
            urlV2: 'https://core.app/offers'
          },
          notification: {
            title: 'Special Offer',
            body: 'Limited time promotion available',
            sound: 'promo'
          }
        }

        const result = NotificationPayloadSchema.safeParse(payload)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('invalid schemas', () => {
    describe('balance change validation errors', () => {
      it('rejects balance change with missing required fields', () => {
        const invalidPayload = {
          data: {
            type: NotificationTypes.BALANCE_CHANGES,
            event: BalanceChangeEvents.BALANCES_RECEIVED
            // missing title, body, accountAddress, chainId, transactionHash, url
          }
        }

        const result = NotificationPayloadSchema.safeParse(invalidPayload)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0)
        }
      })

      it('rejects balance change with invalid accountAddress format', () => {
        const invalidPayload = {
          data: {
            type: NotificationTypes.BALANCE_CHANGES,
            event: BalanceChangeEvents.BALANCES_RECEIVED,
            title: 'Test',
            body: 'Test',
            accountAddress: 'invalid-address', // should start with 0x
            chainId: '43114',
            transactionHash:
              '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            url: 'https://example.com'
          }
        }

        const result = NotificationPayloadSchema.safeParse(invalidPayload)
        expect(result.success).toBe(false)
      })

      it('rejects balance change with invalid transactionHash format', () => {
        const invalidPayload = {
          data: {
            type: NotificationTypes.BALANCE_CHANGES,
            event: BalanceChangeEvents.BALANCES_RECEIVED,
            title: 'Test',
            body: 'Test',
            accountAddress: '0x742d35Cc6634C0532925a3b8D58C5B89FC2A74c0',
            chainId: '43114',
            transactionHash: 'invalid-hash', // should start with 0x
            url: 'https://example.com'
          }
        }

        const result = NotificationPayloadSchema.safeParse(invalidPayload)
        expect(result.success).toBe(false)
      })
    })

    describe('news validation errors', () => {
      it('rejects news with missing required fields', () => {
        const invalidPayload = {
          data: {
            type: NotificationTypes.NEWS,
            event: NewsEvents.PRODUCT_ANNOUNCEMENTS
            // missing title, body, urlV2
          }
        }

        const result = NotificationPayloadSchema.safeParse(invalidPayload)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0)
        }
      })

      it('rejects news with invalid event type', () => {
        const invalidPayload = {
          data: {
            type: NotificationTypes.NEWS,
            event: 'INVALID_NEWS_EVENT' as NewsEvents,
            title: 'Test',
            body: 'Test',
            urlV2: 'https://example.com'
          }
        }

        const result = NotificationPayloadSchema.safeParse(invalidPayload)
        expect(result.success).toBe(false)
      })
    })

    describe('general validation errors', () => {
      it('rejects payload with no data field', () => {
        const invalidPayload = {
          notification: {
            title: 'Test',
            body: 'Test'
          }
        }

        const result = NotificationPayloadSchema.safeParse(invalidPayload)
        expect(result.success).toBe(false)
      })

      it('rejects completely empty payload', () => {
        const result = NotificationPayloadSchema.safeParse({})
        expect(result.success).toBe(false)
      })

      it('rejects notification with invalid channelId', () => {
        const invalidPayload = {
          data: {
            type: NotificationTypes.NEWS,
            event: NewsEvents.MARKET_NEWS,
            title: 'Test',
            body: 'Test',
            urlV2: 'https://example.com'
          },
          notification: {
            title: 'Test',
            body: 'Test',
            android: {
              channelId: 'INVALID_CHANNEL' as ChannelId
            }
          }
        }

        const result = NotificationPayloadSchema.safeParse(invalidPayload)
        expect(result.success).toBe(false)
      })
    })
  })
})

describe('BalanceChangeDataSchema', () => {
  it('validates standalone balance change data', () => {
    const validData = {
      type: NotificationTypes.BALANCE_CHANGES,
      event: BalanceChangeEvents.ALLOWANCE_APPROVED,
      title: 'Allowance Approved',
      body: 'Token allowance has been approved',
      accountAddress: '0x742d35Cc6634C0532925a3b8D58C5B89FC2A74c0',
      chainId: '1',
      transactionHash:
        '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
      url: 'https://etherscan.io/tx/0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba'
    }

    const result = BalanceChangeDataSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
})

describe('NewsDataSchema', () => {
  it('validates standalone news data', () => {
    const validData = {
      type: NotificationTypes.NEWS,
      event: NewsEvents.PRICE_ALERTS,
      title: 'Price Alert Triggered',
      body: 'Your price alert for AVAX has been triggered',
      urlV2: 'https://core.app/price-alerts/avax'
    }

    const result = NewsDataSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
})
