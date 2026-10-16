import React, { useEffect, useRef, useState } from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { Pressable, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { ApprovalParams } from 'services/walletconnectv2/walletConnectCache/types'
import { shouldNavigateBackAfterApprove } from 'features/approval/screens/ApprovalScreen/utils'
import { withWalletConnectCache } from './withWalletConnectCache'

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn()
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), info: jest.fn(), warn: jest.fn() }
}))

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock

const Probe = ({ params }: { params: ApprovalParams }): JSX.Element => (
  <Text testID="probe">{(params as unknown as { tag: string }).tag}</Text>
)

describe('withWalletConnectCache', () => {
  it('re-reads the keyed cache when the requestId route param changes', () => {
    const Wrapped = withWalletConnectCache('approvalParams', {
      requestIdParam: 'requestId'
    })(Probe as React.ComponentType<{ params: ApprovalParams }>)

    walletConnectCache.approvalParams.set('r1', {
      tag: 'first'
    } as unknown as ApprovalParams)
    walletConnectCache.approvalParams.set('r2', {
      tag: 'second'
    } as unknown as ApprovalParams)

    mockUseLocalSearchParams.mockReturnValue({ requestId: 'r1' })
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<Wrapped />)
    })
    const probeText = (): unknown =>
      renderer.root.findByProps({ testID: 'probe' }).props.children
    expect(probeText()).toBe('first')

    // Expo Router reuses the mounted route with a new requestId.
    mockUseLocalSearchParams.mockReturnValue({ requestId: 'r2' })
    act(() => {
      renderer.update(<Wrapped />)
    })
    expect(probeText()).toBe('second')
  })

  it('renders nothing when the new requestId has no cache entry', () => {
    const Wrapped = withWalletConnectCache('approvalParams', {
      requestIdParam: 'requestId'
    })(Probe as React.ComponentType<{ params: ApprovalParams }>)

    walletConnectCache.approvalParams.set('a', {
      tag: 'first'
    } as unknown as ApprovalParams)

    mockUseLocalSearchParams.mockReturnValue({ requestId: 'a' })
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<Wrapped />)
    })
    expect(renderer.toJSON()).not.toBeNull()

    mockUseLocalSearchParams.mockReturnValue({ requestId: 'b' })
    act(() => {
      renderer.update(<Wrapped />)
    })
    expect(renderer.toJSON()).toBeNull()
  })
  describe('switching requests on a reused route', () => {
    type Entry = {
      tag: string
      onApprove: jest.Mock
      onReject: jest.Mock
    }
    const entry = (tag: string): Entry => ({
      tag,
      onApprove: jest.fn().mockResolvedValue(undefined),
      onReject: jest.fn()
    })

    // Holds per-mount state (like ApprovalScreen's confirmed DANGER alert)
    // and records every mount with the params it mounted with.
    const mounts: string[] = []
    let current: Entry | undefined
    const StatefulProbe = ({
      params
    }: {
      params: ApprovalParams
    }): JSX.Element => {
      const p = params as unknown as Entry
      const [confirmed, setConfirmed] = useState(false)
      current = p
      useEffect(() => {
        mounts.push(p.tag)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])
      return (
        <Pressable testID="confirm" onPress={() => setConfirmed(true)}>
          <Text testID="probe">{`${p.tag}|${confirmed}`}</Text>
        </Pressable>
      )
    }

    const setup = (
      a: Entry,
      b: Entry
    ): {
      text: () => unknown
      confirm: () => void
      switchTo: (id: string) => void
    } => {
      mounts.length = 0
      const Wrapped = withWalletConnectCache('approvalParams', {
        requestIdParam: 'requestId'
      })(StatefulProbe as React.ComponentType<{ params: ApprovalParams }>)
      walletConnectCache.approvalParams.set('A', a as unknown as ApprovalParams)
      walletConnectCache.approvalParams.set('B', b as unknown as ApprovalParams)
      mockUseLocalSearchParams.mockReturnValue({ requestId: 'A' })
      let renderer!: TestRenderer.ReactTestRenderer
      act(() => {
        renderer = TestRenderer.create(<Wrapped />)
      })
      return {
        text: () =>
          renderer.root.findByProps({ testID: 'probe' }).props.children,
        confirm: () =>
          act(() => {
            renderer.root.findByProps({ testID: 'confirm' }).props.onPress()
          }),
        switchTo: (id: string) => {
          mockUseLocalSearchParams.mockReturnValue({ requestId: id })
          act(() => {
            renderer.update(<Wrapped />)
          })
        }
      }
    }

    it('remounts the screen so no state carries over to the next request', () => {
      const { text, confirm, switchTo } = setup(entry('A'), entry('B'))
      confirm()
      expect(text()).toBe('A|true')
      switchTo('B')
      expect(text()).toBe('B|false')
    })

    it("never mounts a screen with the previous request's params", () => {
      const { switchTo } = setup(entry('A'), entry('B'))
      switchTo('B')
      expect(mounts).toEqual(['A', 'B'])
    })

    it('rejects the previous request once when the user had not acted on it', () => {
      const a = entry('A')
      const { switchTo } = setup(a, entry('B'))
      switchTo('B')
      expect(a.onReject).toHaveBeenCalledTimes(1)
    })

    it('does not reject a previous request whose approval is in flight', () => {
      const a = entry('A')
      const { switchTo } = setup(a, entry('B'))
      act(() => {
        current?.onApprove()
      })
      expect(a.onApprove).toHaveBeenCalledTimes(1)
      switchTo('B')
      expect(a.onReject).not.toHaveBeenCalled()
    })

    it('does not reject a previous request again after the user rejected it', () => {
      const a = entry('A')
      const { switchTo } = setup(a, entry('B'))
      act(() => {
        current?.onReject('user said no')
      })
      switchTo('B')
      expect(a.onReject).toHaveBeenCalledTimes(1)
      expect(a.onReject).toHaveBeenCalledWith('user said no')
    })

    it('does not navigate back or reject the new request when the replaced approval resolves', async () => {
      // Mirrors ApprovalScreen's approve handler: navigate back after the
      // approval resolves, but only while this screen is still mounted.
      const back = jest.fn()
      const ApproveProbe = ({
        params
      }: {
        params: ApprovalParams
      }): JSX.Element => {
        const p = params as unknown as Entry
        const isMountedRef = useRef(true)
        useEffect(() => {
          isMountedRef.current = true
          return () => {
            isMountedRef.current = false
          }
        }, [])
        current = p
        ;(p as unknown as { approve: () => Promise<void> }).approve =
          async () => {
            await p.onApprove()
            if (shouldNavigateBackAfterApprove(false, isMountedRef.current)) {
              back()
            }
          }
        return <Text testID="probe">{p.tag}</Text>
      }
      let resolveA!: () => void
      const a = entry('A')
      a.onApprove.mockReturnValue(
        new Promise<void>(resolve => {
          resolveA = resolve
        })
      )
      const b = entry('B')
      const Wrapped = withWalletConnectCache('approvalParams', {
        requestIdParam: 'requestId'
      })(ApproveProbe as React.ComponentType<{ params: ApprovalParams }>)
      walletConnectCache.approvalParams.set('A', a as unknown as ApprovalParams)
      walletConnectCache.approvalParams.set('B', b as unknown as ApprovalParams)
      mockUseLocalSearchParams.mockReturnValue({ requestId: 'A' })
      let renderer!: TestRenderer.ReactTestRenderer
      act(() => {
        renderer = TestRenderer.create(<Wrapped />)
      })
      const approveA = (
        current as unknown as { approve: () => Promise<void> }
      ).approve()

      mockUseLocalSearchParams.mockReturnValue({ requestId: 'B' })
      act(() => {
        renderer.update(<Wrapped />)
      })
      await act(async () => {
        resolveA()
        await approveA
      })

      expect(back).not.toHaveBeenCalled()
      expect(b.onReject).not.toHaveBeenCalled()
      expect(a.onReject).not.toHaveBeenCalled()
    })

    it('rejects the previous request even when the new id has no cache entry', () => {
      const a = entry('A')
      const { switchTo } = setup(a, entry('B'))
      switchTo('missing')
      expect(a.onReject).toHaveBeenCalledTimes(1)
    })
  })
})
