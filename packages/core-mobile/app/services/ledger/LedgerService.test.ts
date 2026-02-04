import { jest } from '@jest/globals'
import Logger from 'utils/Logger'
import LedgerService from './LedgerService'
import { LedgerAppType } from './types'

describe('LedgerService', () => {
  describe('openApp', () => {
    let mockTransport: {
      exchange: jest.Mock
      isConnected: boolean
      close: jest.Mock
    }

    beforeEach(() => {
      // Create mock transport
      mockTransport = {
        exchange: jest.fn(),
        isConnected: true,
        close: jest.fn()
      }

      // Mock Logger methods
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(Logger, 'info').mockImplementation(() => {})
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(Logger, 'error').mockImplementation(() => {})

      // Set the transport on the service (using private field)
      // @ts-expect-error - accessing private field for testing
      LedgerService['#transport'] = mockTransport
    })

    afterEach(() => {
      jest.clearAllMocks()
      // Clean up transport
      // @ts-expect-error - accessing private field for testing
      LedgerService['#transport'] = null
    })

    it('should successfully open the app when device returns success status code', async () => {
      const appType = LedgerAppType.AVALANCHE

      // Mock successful response: data + status word (0x9000)
      const successResponse = Buffer.from([0x90, 0x00])
      mockTransport.exchange.mockResolvedValue(successResponse as never)

      await LedgerService.openApp(appType)

      // Verify APDU was sent
      expect(mockTransport.exchange).toHaveBeenCalledTimes(1)

      // Verify the APDU structure
      // @ts-ignore
      const apdu = mockTransport.exchange.mock.calls[0][0] as Buffer
      expect(apdu[0]).toBe(0xe0) // CLA
      expect(apdu[1]).toBe(0xd8) // INS
      expect(apdu[2]).toBe(0x00) // P1
      expect(apdu[3]).toBe(0x00) // P2
      expect(apdu[4]).toBe(appType.length) // Lc (length)

      // Verify app name in APDU
      const appNameBytes = apdu.slice(5)
      expect(appNameBytes.toString('ascii')).toBe(appType)

      // Verify success was logged
      expect(Logger.info).toHaveBeenCalledWith(
        `Successfully opened ${appType} app on Ledger device using APDU`
      )
    })

    it('should log info when device returns non-success status code', async () => {
      const appType = LedgerAppType.SOLANA

      // Mock response with error status code (0x6985 = USER_REJECTED)
      const errorResponse = Buffer.from([0x69, 0x85])
      mockTransport.exchange.mockResolvedValue(errorResponse as never)

      await LedgerService.openApp(appType)

      // Verify exchange was called
      expect(mockTransport.exchange).toHaveBeenCalledTimes(1)

      // Verify non-success status was logged
      expect(Logger.info).toHaveBeenCalledWith('Unexpected status word: 0x6985')
    })

    it('should handle APP_NOT_OPEN error code gracefully', async () => {
      const appType = LedgerAppType.ETHEREUM

      // Mock response with APP_NOT_OPEN status code (0x6a80)
      const errorResponse = Buffer.from([0x6a, 0x80]) as never
      mockTransport.exchange.mockResolvedValue(errorResponse)

      await LedgerService.openApp(appType)

      expect(mockTransport.exchange).toHaveBeenCalledTimes(1)
      expect(Logger.info).toHaveBeenCalledWith('Unexpected status word: 0x6a80')
    })

    it('should handle DEVICE_LOCKED error code gracefully', async () => {
      const appType = LedgerAppType.BITCOIN

      // Mock response with DEVICE_LOCKED status code (0x5515)
      const errorResponse = Buffer.from([0x55, 0x15]) as never
      mockTransport.exchange.mockResolvedValue(errorResponse)

      await LedgerService.openApp(appType)

      expect(mockTransport.exchange).toHaveBeenCalledTimes(1)
      expect(Logger.info).toHaveBeenCalledWith('Unexpected status word: 0x5515')
    })

    it('should not throw error when exchange fails', async () => {
      const appType = LedgerAppType.AVALANCHE
      const exchangeError = new Error('Transport exchange failed')

      mockTransport.exchange.mockRejectedValue(exchangeError as never)

      // Should not throw
      await expect(LedgerService.openApp(appType)).resolves.toBeUndefined()

      // Verify error was logged as info (best-effort)
      expect(Logger.info).toHaveBeenCalledWith(
        `Failed to open ${appType} app:`,
        exchangeError
      )
    })

    it('should handle transport disconnection error gracefully', async () => {
      const appType = LedgerAppType.SOLANA
      const disconnectError = new Error('Transport not connected') as never

      mockTransport.exchange.mockRejectedValue(disconnectError)

      await LedgerService.openApp(appType)

      expect(Logger.info).toHaveBeenCalledWith(
        `Failed to open ${appType} app:`,
        disconnectError
      )
    })

    it('should build correct APDU for different app types', async () => {
      const testCases = [
        LedgerAppType.AVALANCHE,
        LedgerAppType.SOLANA,
        LedgerAppType.ETHEREUM,
        LedgerAppType.BITCOIN
      ]

      for (const appType of testCases) {
        const successResponse = Buffer.from([0x90, 0x00])
        mockTransport.exchange.mockResolvedValue(successResponse as never)

        await LedgerService.openApp(appType)

        // @ts-ignore
        const apdu = mockTransport.exchange.mock.calls[
          mockTransport.exchange.mock.calls.length - 1
        ][0] as Buffer

        // Verify APDU structure
        expect(apdu[0]).toBe(0xe0)
        expect(apdu[1]).toBe(0xd8)
        expect(apdu[2]).toBe(0x00)
        expect(apdu[3]).toBe(0x00)
        expect(apdu[4]).toBe(appType.length)

        // Verify app name
        const appNameBytes = apdu.slice(5)
        expect(appNameBytes.toString('ascii')).toBe(appType)
      }
    })

    it('should handle response with data before status word', async () => {
      const appType = LedgerAppType.AVALANCHE

      // Mock response with some data followed by success status word
      const responseWithData = Buffer.from([0x01, 0x02, 0x03, 0x90, 0x00])
      mockTransport.exchange.mockResolvedValue(responseWithData as never)

      await LedgerService.openApp(appType)

      // Should extract status word correctly from the last 2 bytes
      expect(Logger.info).toHaveBeenCalledWith(
        `Successfully opened ${appType} app on Ledger device using APDU`
      )
    })

    it('should format status codes with proper padding', async () => {
      const appType = LedgerAppType.AVALANCHE

      // Mock response with low byte values that need padding (0x0001)
      const lowByteResponse = Buffer.from([0x00, 0x01])
      mockTransport.exchange.mockResolvedValue(lowByteResponse as never)

      await LedgerService.openApp(appType)

      // Verify padding is applied correctly
      expect(Logger.info).toHaveBeenCalledWith('Unexpected status word: 0x0001')
    })

    it('should handle COMMAND_NOT_ALLOWED status code', async () => {
      const appType = LedgerAppType.ETHEREUM

      // Mock response with COMMAND_NOT_ALLOWED (0x6986)
      const errorResponse = Buffer.from([0x69, 0x86]) as never
      mockTransport.exchange.mockResolvedValue(errorResponse)

      await LedgerService.openApp(appType)

      expect(Logger.info).toHaveBeenCalledWith('Unexpected status word: 0x6986')
    })

    it('should handle minimum valid response (2 bytes)', async () => {
      const appType = LedgerAppType.SOLANA

      // Minimum valid response is 2 bytes (SW1, SW2)
      const minResponse = Buffer.from([0x90, 0x00]) as never
      mockTransport.exchange.mockResolvedValue(minResponse)

      await LedgerService.openApp(appType)

      expect(mockTransport.exchange).toHaveBeenCalledTimes(1)
      expect(Logger.info).toHaveBeenCalledWith(
        `Successfully opened ${appType} app on Ledger device using APDU`
      )
    })
  })

  describe('buildOpenAppApdu', () => {
    it('should build correct APDU structure', () => {
      const appName = 'TestApp'

      // @ts-ignore - testing private method
      const apdu = LedgerService.buildOpenAppApdu(appName) as Buffer

      // Verify header
      expect(apdu[0]).toBe(0xe0) // CLA
      expect(apdu[1]).toBe(0xd8) // INS
      expect(apdu[2]).toBe(0x00) // P1
      expect(apdu[3]).toBe(0x00) // P2
      expect(apdu[4]).toBe(appName.length) // Lc

      // Verify data (app name)
      const dataBytes = apdu.slice(5)
      expect(dataBytes.toString('ascii')).toBe(appName)

      // Verify total length
      expect(apdu.length).toBe(5 + appName.length)
    })

    it('should handle empty app name', () => {
      const appName = ''

      // @ts-ignore - testing private method
      const apdu = LedgerService.buildOpenAppApdu(appName) as Buffer

      expect(apdu[4]).toBe(0) // Lc = 0
      expect(apdu.length).toBe(5) // Header only
    })

    it('should handle long app name', () => {
      const appName = 'VeryLongApplicationName'

      // @ts-ignore - testing private method
      const apdu = LedgerService.buildOpenAppApdu(appName) as Buffer

      expect(apdu[4]).toBe(appName.length)
      expect(apdu.slice(5).toString('ascii')).toBe(appName)
      expect(apdu.length).toBe(5 + appName.length)
    })

    it('should encode app name as ASCII bytes', () => {
      const appName = 'Avalanche'

      // @ts-ignore - testing private method
      const apdu = LedgerService.buildOpenAppApdu(appName) as Buffer

      const expectedBytes = Buffer.from(appName, 'ascii')
      const actualBytes = apdu.slice(5)

      expect(actualBytes).toEqual(expectedBytes)
    })
  })
})
