import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { DetailItemType, DetailSection } from '@avalabs/vm-module-types'

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
    Pressable: passThrough('Pressable'),
    TouchableOpacity: passThrough('TouchableOpacity'),
    Separator: passThrough('Separator'),
    Icons: {
      Navigation: { ChevronRight: passThrough('ChevronRight') },
      Custom: { Outbound: passThrough('Outbound') }
    },
    alpha: (color: string) => color,
    showAlert: jest.fn(),
    useTheme: () => ({
      theme: {
        colors: {
          $textPrimary: '#000',
          $textSecondary: '#999',
          $surfaceSecondary: '#eee'
        }
      }
    })
  }
})
jest.mock('react-redux', () => ({ useSelector: () => 'USD' }))
jest.mock('common/hooks/useMarketTokenBySymbol', () => ({
  useGetMarketTokenBySymbol: () => () => undefined
}))
jest.mock('new/common/hooks/useFormatCurrency', () => ({
  useFormatCurrency: () => ({ formatTokenInCurrency: () => '' })
}))
jest.mock('common/components/TokenLogo', () => ({ TokenLogo: () => null }))
jest.mock('new/common/utils/clipboard', () => ({
  copyToClipboard: (...args: unknown[]) => mockCopyToClipboard(...args)
}))
jest.mock('common/hooks/useInAppBrowser', () => ({
  __esModule: true,
  default: () => ({ openUrl: mockOpenUrl })
}))

import { Details } from './Details'

const TO = '0x1111111111111111111111111111111111111111'
const CONTRACT = '0x2222222222222222222222222222222222222222'
const LIST_A = '0x3333333333333333333333333333333333333333'

const section: DetailSection = {
  title: 'Transaction Details',
  items: [
    { type: DetailItemType.ADDRESS, label: 'To', value: TO },
    { type: DetailItemType.ADDRESS, label: 'Contract', value: CONTRACT },
    { type: DetailItemType.ADDRESS_LIST, label: 'Recipients', value: [LIST_A] }
  ]
}

const renderDetails = async (
  explorerUrl?: string
): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(
      <Details detailSection={section} explorerUrl={explorerUrl} />
    )
  })
  return instance
}

const explorerButton = (
  instance: renderer.ReactTestRenderer,
  address: string
): renderer.ReactTestInstance[] =>
  instance.root.findAll(
    node =>
      node.props.testID === `explorer_link__${address}` &&
      typeof node.type === 'string'
  )

describe('<Details /> explorer links', () => {
  it('renders an explorer link next to every address that opens the explorer', async () => {
    const instance = await renderDetails('https://snowtrace.io')

    for (const address of [TO, CONTRACT, LIST_A]) {
      const [button] = explorerButton(instance, address)
      expect(button).toBeDefined()
      await act(async () => {
        ;(button?.props.onPress as () => void)()
      })
      expect(mockOpenUrl).toHaveBeenLastCalledWith(
        `https://snowtrace.io/address/${address}`
      )
    }
    expect(mockOpenUrl).toHaveBeenCalledTimes(3)
  })

  it('keeps copy-to-clipboard on the address itself', async () => {
    const instance = await renderDetails('https://snowtrace.io')
    const text = instance.root.findByProps({ testID: `address__${TO}` })
    const pressable = text.parent?.parent

    await act(async () => {
      ;(pressable?.props.onPress as () => void)()
    })

    expect(mockCopyToClipboard).toHaveBeenCalledWith(TO, 'Address copied')
    expect(mockOpenUrl).not.toHaveBeenCalled()
  })

  it('hides the explorer links when the network has no explorer', async () => {
    const instance = await renderDetails(undefined)

    expect(explorerButton(instance, TO)).toHaveLength(0)
    expect(explorerButton(instance, CONTRACT)).toHaveLength(0)
    expect(explorerButton(instance, LIST_A)).toHaveLength(0)
    expect(instance.root.findByProps({ testID: `address__${TO}` })).toBeTruthy()
  })
})
