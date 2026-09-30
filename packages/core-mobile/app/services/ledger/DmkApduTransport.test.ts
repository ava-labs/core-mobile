import * as Sentry from '@sentry/react-native'
import { DeviceManagementKit } from '@ledgerhq/device-management-kit'
import { DmkApduTransport } from './DmkApduTransport'

jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn()
}))

const SESSION_ID = 'test-session-id'

const reply = (
  data: number[],
  statusCode: [number, number]
): { data: Uint8Array; statusCode: Uint8Array } => ({
  data: new Uint8Array(data),
  statusCode: new Uint8Array(statusCode)
})

describe('DmkApduTransport', () => {
  let sendApdu: jest.Mock
  let transport: DmkApduTransport

  beforeEach(() => {
    jest.clearAllMocks()
    sendApdu = jest.fn().mockResolvedValue(reply([], [0x90, 0x00]))
    transport = new DmkApduTransport(
      { sendApdu } as unknown as DeviceManagementKit,
      SESSION_ID
    )
  })

  const sentApdu = (): Uint8Array =>
    (sendApdu.mock.calls[0]?.[0] as { apdu: Uint8Array }).apdu

  describe('request framing', () => {
    it('frames CLA INS P1 P2 Lc followed by the payload', async () => {
      await transport.send(0x80, 0x02, 0x01, 0x03, Buffer.from([0xaa, 0xbb]))

      expect(Array.from(sentApdu())).toEqual([
        0x80, 0x02, 0x01, 0x03, 0x02, 0xaa, 0xbb
      ])
    })

    it('sends Lc = 0 when there is no payload', async () => {
      await transport.send(0xe0, 0x01, 0x00, 0x00)

      expect(Array.from(sentApdu())).toEqual([0xe0, 0x01, 0x00, 0x00, 0x00])
    })

    it('targets the session and forwards the abort timeout', async () => {
      await transport.send(0x80, 0x02, 0, 0, undefined, undefined, {
        abortTimeoutMs: 5000
      })

      expect(sendApdu).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: SESSION_ID, abortTimeout: 5000 })
      )
    })

    it('accepts a payload at the 255-byte Lc limit', async () => {
      await transport.send(0x80, 0x02, 0, 0, Buffer.alloc(255, 0x01))

      expect(sentApdu()).toHaveLength(5 + 255)
      expect(sentApdu()[4]).toBe(255)
    })

    it('rejects a payload over the 255-byte Lc limit without sending', async () => {
      await expect(
        transport.send(0x80, 0x02, 0, 0, Buffer.alloc(256))
      ).rejects.toThrow('exceeds the 255-byte limit')

      expect(sendApdu).not.toHaveBeenCalled()
    })
  })

  describe('status handling', () => {
    it('returns the response data followed by the status word on success', async () => {
      sendApdu.mockResolvedValue(reply([0x01, 0x02, 0x03], [0x90, 0x00]))

      const response = await transport.send(0x80, 0x02, 0, 0)

      expect(Array.from(response)).toEqual([0x01, 0x02, 0x03, 0x90, 0x00])
    })

    it('throws with the numeric statusCode on a rejected status word', async () => {
      sendApdu.mockResolvedValue(reply([], [0x69, 0x85]))

      const error = await transport
        .send(0x80, 0x02, 0, 0)
        .catch((e: unknown) => e)

      expect(error).toBeInstanceOf(Error)
      expect(error).toMatchObject({
        name: 'LedgerApduStatusError',
        statusCode: 0x6985,
        message: 'Ledger device returned 0x6985'
      })
    })

    it('accepts a non-success status word the caller allowed', async () => {
      sendApdu.mockResolvedValue(reply([0x42], [0x6a, 0x80]))

      const response = await transport.send(0x80, 0x02, 0, 0, undefined, [
        0x9000, 0x6a80
      ])

      expect(Array.from(response)).toEqual([0x42, 0x6a, 0x80])
    })

    it('rejects a success status word the caller did not allow', async () => {
      await expect(
        transport.send(0x80, 0x02, 0, 0, undefined, [0x6a80])
      ).rejects.toMatchObject({ statusCode: 0x9000 })
    })

    it('propagates errors thrown by the kit', async () => {
      sendApdu.mockRejectedValue(new Error('Device disconnected'))

      await expect(transport.send(0x80, 0x02, 0, 0)).rejects.toThrow(
        'Device disconnected'
      )
    })
  })

  describe('breadcrumbs', () => {
    it('records frame metadata without payload bytes', async () => {
      sendApdu.mockResolvedValue(reply([0x01, 0x02], [0x69, 0x85]))

      await transport
        .send(0x80, 0x02, 0, 0, Buffer.from([0xde, 0xad]))
        .catch(() => undefined)

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            cla: '80',
            ins: '02',
            replyLength: 2,
            statusWord: '6985'
          }
        })
      )
    })

    it('does not fail the exchange when breadcrumb capture throws', async () => {
      ;(Sentry.addBreadcrumb as jest.Mock).mockImplementation(() => {
        throw new Error('sentry down')
      })

      await expect(transport.send(0x80, 0x02, 0, 0)).resolves.toBeDefined()
    })
  })
})
