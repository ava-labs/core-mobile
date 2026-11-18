import React from 'react'
import renderer, { act } from 'react-test-renderer'

const mockOpenUrl = jest.fn()

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
    Pressable: passThrough('Pressable'),
    TouchableOpacity: passThrough('TouchableOpacity'),
    Icons: { Custom: { Outbound: passThrough('Outbound') } },
    alpha: (color: string) => color,
    useTheme: () => ({
      theme: { colors: { $textPrimary: '#000', $textSecondary: '#999' } }
    })
  }
})
jest.mock('new/common/utils/clipboard', () => ({ copyToClipboard: jest.fn() }))
jest.mock('common/hooks/useInAppBrowser', () => ({
  __esModule: true,
  default: () => ({ openUrl: mockOpenUrl })
}))

import { Account } from './Account'

const ADDRESS = '0x6666666666666666666666666666666666666666'

const renderAccount = async (
  explorerUrl?: string
): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(
      <Account address={ADDRESS} explorerUrl={explorerUrl} />
    )
  })
  return instance
}

const explorerButtons = (
  instance: renderer.ReactTestRenderer
): renderer.ReactTestInstance[] =>
  instance.root.findAll(
    node =>
      node.props.testID === `explorer_link__${ADDRESS}` &&
      typeof node.type === 'string'
  )

describe('<Account /> explorer link', () => {
  it('opens the account address on the network explorer', async () => {
    const instance = await renderAccount('https://explorer.solana.com')
    const [button] = explorerButtons(instance)

    await act(async () => {
      ;(button?.props.onPress as () => void)()
    })

    expect(mockOpenUrl).toHaveBeenCalledWith(
      `https://explorer.solana.com/address/${ADDRESS}`
    )
  })

  it('renders no explorer link without an explorer URL', async () => {
    const instance = await renderAccount('')

    expect(explorerButtons(instance)).toHaveLength(0)
  })
})
