import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { TokenType } from '@avalabs/vm-module-types'
import type { SpendLimit } from 'hooks/useSpendLimits'

const mockOpenUrl = jest.fn()
const mockCopyToClipboard = jest.fn()

jest.mock('@avalabs/k2-alpine', () => {
  const ReactActual = jest.requireActual('react')
  const passThrough =
    (name: string) =>
    (
      props: React.PropsWithChildren<Record<string, unknown>>
    ): React.ReactNode =>
      ReactActual.createElement(name, props, props.children)
  return {
    View: passThrough('View'),
    Text: passThrough('Text'),
    TouchableOpacity: passThrough('TouchableOpacity'),
    Icons: { Custom: { Outbound: passThrough('Outbound') } },
    // Render each row's title and value so the spender row is reachable.
    GroupList: ({
      data
    }: {
      data: { title: string; value: React.ReactNode }[]
    }): React.ReactNode =>
      ReactActual.createElement(
        'GroupList',
        null,
        data.map(item =>
          ReactActual.createElement(
            'Row',
            { key: item.title, title: item.title },
            item.value
          )
        )
      ),
    useTheme: () => ({ theme: { colors: { $textSecondary: '#999' } } })
  }
})
jest.mock('hooks/useSpendLimits', () => ({
  Limit: { DEFAULT: 'DEFAULT', UNLIMITED: 'UNLIMITED', CUSTOM: 'CUSTOM' }
}))
jest.mock('react-redux', () => ({ useSelector: () => undefined }))
jest.mock('common/hooks/useFormatCurrency', () => ({
  useFormatCurrency: () => ({ formatTokenInCurrency: () => '' })
}))
jest.mock('common/hooks/useMarketTokenBySymbol', () => ({
  useMarketTokenBySymbol: () => undefined
}))
jest.mock('new/common/components/DropdownMenuIcons', () => ({
  DropdownMenuIcon: { Check: 'check' }
}))
jest.mock('./SpendLimitOptions', () => ({ SpendLimitOptions: () => null }))
jest.mock('new/common/utils/clipboard', () => ({
  copyToClipboard: (...args: unknown[]) => mockCopyToClipboard(...args)
}))
jest.mock('common/hooks/useInAppBrowser', () => ({
  __esModule: true,
  default: () => ({ openUrl: mockOpenUrl })
}))

import { SpendLimits } from './SpendLimits'

const SPENDER = '0x4444444444444444444444444444444444444444'

const spendLimit = {
  limitType: 'UNLIMITED',
  tokenApproval: {
    token: {
      type: TokenType.ERC20,
      symbol: 'USDC',
      decimals: 6,
      address: '0x5555555555555555555555555555555555555555'
    },
    spenderAddress: SPENDER
  }
} as unknown as SpendLimit

const renderSpendLimits = async (
  explorerUrl?: string
): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(
      <SpendLimits
        spendLimits={[spendLimit]}
        hasBalanceChange
        explorerUrl={explorerUrl}
      />
    )
  })
  return instance
}

const explorerButtons = (
  instance: renderer.ReactTestRenderer
): renderer.ReactTestInstance[] =>
  instance.root.findAll(
    node =>
      node.props.testID === `explorer_link__${SPENDER}` &&
      typeof node.type === 'string'
  )

describe('<SpendLimits /> spender explorer link', () => {
  it('opens the spender address on the network explorer', async () => {
    const instance = await renderSpendLimits('https://etherscan.io')
    const [button] = explorerButtons(instance)

    expect(button).toBeDefined()
    await act(async () => {
      ;(button?.props.onPress as () => void)()
    })

    expect(mockOpenUrl).toHaveBeenCalledWith(
      `https://etherscan.io/address/${SPENDER}`
    )
    expect(mockCopyToClipboard).not.toHaveBeenCalled()
  })

  it('hides the explorer link when the network has no explorer', async () => {
    const instance = await renderSpendLimits(undefined)

    expect(explorerButtons(instance)).toHaveLength(0)
    expect(instance.root.findByProps({ title: 'Spender' })).toBeTruthy()
  })
})
