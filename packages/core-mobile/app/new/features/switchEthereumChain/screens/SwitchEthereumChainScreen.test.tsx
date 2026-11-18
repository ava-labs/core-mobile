import React from 'react'
import renderer, { act, ReactTestRenderer } from 'react-test-renderer'
import type { Network } from '@avalabs/core-chains-sdk'
import type { SwitchEthereumChainParams } from 'services/walletconnectv2/walletConnectCache/types'

const mockOnUserApproved = jest.fn()
const mockOnUserRejected = jest.fn()
let mockIsDeveloperMode = false

type SheetProps = {
  confirm: { label: string; onPress: () => void }
  cancel: { label: string; onPress: () => void }
  alert?: { message: string }
  children: React.ReactNode
}
let mockSheetProps: SheetProps | undefined

jest.mock('@avalabs/k2-alpine', () => {
  const r = require('react') as typeof import('react')
  return {
    Text: (props: React.PropsWithChildren<Record<string, unknown>>) =>
      r.createElement('Text', props, props.children),
    GroupList: (props: Record<string, unknown>) =>
      r.createElement('GroupList', props)
  }
})
jest.mock('react-redux', () => ({
  useSelector: () => mockIsDeveloperMode
}))
jest.mock('expo-router', () => ({
  router: { canGoBack: () => true, back: jest.fn() }
}))
jest.mock('hooks/useDappConnectionV2', () => ({
  useDappConnectionV2: () => ({
    onUserApproved: mockOnUserApproved,
    onUserRejected: mockOnUserRejected
  })
}))
jest.mock('common/components/DappLogo', () => ({ DappLogo: () => null }))
jest.mock('common/components/withWalletConnectCache', () => ({
  withWalletConnectCache: () => (component: unknown) => component
}))
jest.mock('common/components/ActionSheet', () => {
  const r = require('react') as typeof import('react')
  return {
    ActionSheet: (props: SheetProps) => {
      mockSheetProps = props
      return r.createElement('ActionSheet', null, props.children)
    }
  }
})

import { SwitchEthereumChainScreen } from './SwitchEthereumChainScreen'

const network = {
  chainId: 11155111,
  chainName: 'Ethereum Sepolia',
  isTestnet: true
} as Network

const request = {
  peerMeta: {
    name: 'app.example.com',
    description: '',
    url: 'https://app.example.com/swap',
    icons: []
  }
} as unknown as SwitchEthereumChainParams['request']

const renderScreen = async (): Promise<ReactTestRenderer> => {
  let instance!: ReactTestRenderer
  await act(async () => {
    instance = renderer.create(
      <SwitchEthereumChainScreen params={{ request, network }} />
    )
  })
  return instance
}

describe('<SwitchEthereumChainScreen />', () => {
  beforeEach(() => {
    mockSheetProps = undefined
    mockIsDeveloperMode = false
  })

  it('names the requesting origin and the target network', async () => {
    const instance = await renderScreen()

    expect(
      instance.root.findByProps({ testID: 'switch_chain_description' }).props
        .children
    ).toBe('app.example.com wants to switch the network to Ethereum Sepolia')
    const rows = instance.root.findByType('GroupList' as never).props.data as {
      title: string
      subtitle: string
    }[]
    expect(rows).toEqual([
      { title: 'Website', subtitle: 'app.example.com' },
      { title: 'Network', subtitle: 'Ethereum Sepolia' },
      { title: 'Chain ID', subtitle: '11155111' },
      { title: 'Network type', subtitle: 'Testnet' }
    ])
  })

  it('approves the request on confirm', async () => {
    await renderScreen()

    act(() => mockSheetProps?.confirm.onPress())

    expect(mockOnUserApproved).toHaveBeenCalledWith(request)
    expect(mockOnUserRejected).not.toHaveBeenCalled()
  })

  it('rejects the request on cancel', async () => {
    await renderScreen()

    act(() => mockSheetProps?.cancel.onPress())

    expect(mockOnUserRejected).toHaveBeenCalledWith(request)
    expect(mockOnUserApproved).not.toHaveBeenCalled()
  })

  it('warns when switching to a testnet from mainnet mode', async () => {
    await renderScreen()

    expect(mockSheetProps?.alert?.message).toContain('testnet')
  })

  it('shows no warning when the network matches the wallet mode', async () => {
    mockIsDeveloperMode = true
    await renderScreen()

    expect(mockSheetProps?.alert).toBeUndefined()
  })
})
