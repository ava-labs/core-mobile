import { PChainTransactionType } from '@avalabs/glacier-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import React from 'react'
import renderer, { act } from 'react-test-renderer'

// Mock @avalabs/k2-alpine so we don't need a dripsy theme provider.
jest.mock('@avalabs/k2-alpine', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  const passthrough =
    (Component: React.ComponentType<unknown>) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ children, sx: _sx, variant: _v, ...rest }: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r.createElement(Component as any, rest as any, children)
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Text: passthrough(rn.Text as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    View: passthrough(rn.View as any),
    alpha: (color: string) => color,
    useTheme: () => ({
      theme: { colors: { $textPrimary: '#fff' } }
    })
  }
})

// Bypass real selectors entirely (no Redux store is mounted in this test) —
// `store/account` and `store/settings/securityPrivacy` are left un-mocked
// since they're real barrel modules other files import named exports from;
// mocking them here previously broke an unrelated module (`store/network`)
// through a circular-import side effect.
jest.mock('react-redux', () => ({
  useSelector: jest.fn(() => undefined)
}))

jest.mock('common/utils/useBlockchainNames', () => ({
  useBlockchainNames: () => ({
    sourceBlockchain: undefined,
    targetBlockchain: undefined
  })
}))

jest.mock('hooks/networks/useNetworks', () => ({
  useNetworks: () => ({ getNetwork: () => undefined })
}))

import { TokenActivityListItemTitle } from './TokenActivityListItemTitle'

const makeTx = (txType: string, address: string): unknown => ({
  hash: '0xa',
  timestamp: 1,
  from: txType === PChainTransactionType.EXPORT_TX ? address : '',
  to: txType === PChainTransactionType.IMPORT_TX ? address : '',
  chainId: '43114',
  isContractCall: false,
  isIncoming: txType === PChainTransactionType.IMPORT_TX,
  isOutgoing: txType === PChainTransactionType.EXPORT_TX,
  isSender: txType === PChainTransactionType.EXPORT_TX,
  gasUsed: '0',
  explorerLink: '',
  txType,
  tokens: [
    {
      type: TokenType.NATIVE,
      name: 'Avalanche',
      symbol: 'AVAX',
      amount: '1.5',
      ...(txType === PChainTransactionType.EXPORT_TX
        ? { from: { address } }
        : { to: { address } })
    }
  ]
})

const flatten = (node: renderer.ReactTestRendererJSON | null): string => {
  if (!node) return ''
  return (node.children ?? [])
    .map(c => (typeof c === 'string' ? c : flatten(c)))
    .join('')
}

describe('TokenActivityListItemTitle import/export', () => {
  it('renders "exported" for a C-Chain export', () => {
    let tree!: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(
        <TokenActivityListItemTitle
          tx={makeTx(PChainTransactionType.EXPORT_TX, '0xUser') as never}
        />
      )
    })
    const text = flatten(tree.toJSON() as renderer.ReactTestRendererJSON)
    expect(text).toMatch(/exported/i)
  })

  it('renders "imported" for a C-Chain import', () => {
    let tree!: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(
        <TokenActivityListItemTitle
          tx={makeTx(PChainTransactionType.IMPORT_TX, '0xUser') as never}
        />
      )
    })
    const text = flatten(tree.toJSON() as renderer.ReactTestRendererJSON)
    expect(text).toMatch(/imported/i)
  })
})
