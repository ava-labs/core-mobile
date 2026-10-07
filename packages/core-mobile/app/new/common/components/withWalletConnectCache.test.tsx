import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { ApprovalParams } from 'services/walletconnectv2/walletConnectCache/types'
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
})
