import DeviceInfo from 'react-native-device-info'
import { truncateNodeId, usesDebugAppCheckProvider } from './Utils'

const setDev = (value: boolean): void => {
  ;(globalThis as unknown as { __DEV__: boolean }).__DEV__ = value
}

describe('/app/utils/Utils', () => {
  /**
   * These pin the real build matrix. The AppCheck provider and the vm-module
   * `Environment` both hang off this predicate, so a regression here silently
   * points a debug-attested build at the production proxy (401 on every X/P
   * Glacier call) — which is exactly what a bare `__DEV__` check did.
   */
  describe('usesDebugAppCheckProvider', () => {
    const originalDev = (globalThis as unknown as { __DEV__: boolean }).__DEV__
    const bundleIdSpy = jest.spyOn(DeviceInfo, 'getBundleId')

    afterEach(() => {
      setDev(originalDev)
      bundleIdSpy.mockReset()
    })

    it('is false for an external release build (real attestation, prod services)', () => {
      setDev(false)
      bundleIdSpy.mockReturnValue('org.avalabs.avaxwallet')

      expect(usesDebugAppCheckProvider()).toBe(false)
    })

    it('is true for an internal release build, despite __DEV__ being false', () => {
      setDev(false)
      bundleIdSpy.mockReturnValue('org.avalabs.avaxwallet.internal')

      expect(usesDebugAppCheckProvider()).toBe(true)
    })

    it('is true for a local dev build', () => {
      setDev(true)
      bundleIdSpy.mockReturnValue('org.avalabs.avaxwallet')

      expect(usesDebugAppCheckProvider()).toBe(true)
    })

    it('is true for an e2e build on an external bundle id', () => {
      setDev(false)
      bundleIdSpy.mockReturnValue('org.avalabs.avaxwallet')

      let usesDebugProvider: boolean | undefined
      jest.isolateModules(() => {
        jest.doMock('react-native-config', () => ({
          __esModule: true,
          default: { E2E_MNEMONIC: 'mock e2e mnemonic' }
        }))

        usesDebugProvider = require('./Utils').usesDebugAppCheckProvider()
      })

      expect(usesDebugProvider).toBe(true)
    })
  })

  describe('truncateNodeId', () => {
    const nodeID = 'NodeID-9zPtXnScuWRvoiTDe498ZtjgoTXwTwxr9'
    it('returns the whole NodeId if size is bigger than length', () => {
      expect(truncateNodeId(nodeID, 33)).toBe(nodeID)
      expect(truncateNodeId(nodeID, 60)).toBe(nodeID)
    })

    it('truncates NodeId to correct length', () => {
      expect(truncateNodeId(nodeID)).toBe('NodeID-9zP…xr9')
      expect(truncateNodeId(nodeID, 10)).toBe('NodeID-9zPtX…Twxr9')
      expect(truncateNodeId(nodeID, 30)).toBe(
        'NodeID-9zPtXnScuWRvoiT…98ZtjgoTXwTwxr9'
      )
      expect(truncateNodeId(nodeID, 3)).toBe('NodeID-9z…9')
    })

    it('handles empty strings', () => {
      expect(truncateNodeId('')).toBe('')
    })

    it('handles <1 size', () => {
      expect(truncateNodeId(nodeID, 0)).toBe('NodeID-')
      expect(truncateNodeId(nodeID, -2)).toBe('NodeID-')
    })
  })
})
