import React from 'react'
import renderer, { act } from 'react-test-renderer'

jest.mock('@avalabs/k2-alpine', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  const pass =
    (C: React.ElementType) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ children, sx: _sx, variant: _v, ...rest }: any) =>
      r.createElement(C, rest, children)
  return {
    View: pass(rn.View),
    Text: pass(rn.Text),
    Icons: {
      Custom: {
        TrendingArrowUp: () => null,
        TrendingArrowDown: () => null
      },
      Navigation: {
        ExpandMore: () => null
      }
    },
    useTheme: () => ({
      theme: {
        colors: {
          $textSuccess: '#0f0',
          $textDanger: '#f00',
          $textSecondary: '#888'
        }
      }
    })
  }
})

jest.mock('common/hooks/useFormatCurrency', () => ({
  useFormatCurrency: () => ({ formatCurrency: () => '$0' })
}))

jest.mock('./PerpsCoinLogo', () => ({ PerpsCoinLogo: () => null }))
jest.mock('./DexBadge', () => ({ DexBadge: () => null }))

// Render the native select as a plain View so tests can find it by testID and
// drive onPressAction directly (zeego itself can't render under jest).
jest.mock('common/components/DropdownMenu', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DropdownMenu: ({ children, ...rest }: any) =>
      r.createElement(rn.View, rest, children)
  }
})

import { PositionPill } from './PositionPill'

const SIDE_SELECT = 'perpetuals_place_order_side_select'

const render = async (
  element: React.ReactElement
): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(element)
  })
  return instance
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sideMenu = (instance: renderer.ReactTestRenderer): any =>
  instance.root.findAllByProps({ testID: SIDE_SELECT })[0]

describe('PositionPill side select', () => {
  it('renders no dropdown trigger without onChangeSide', async () => {
    const instance = await render(
      <PositionPill coin="BTC" price={100} side="long" />
    )
    expect(instance.root.findAllByProps({ testID: SIDE_SELECT })).toHaveLength(
      0
    )
  })

  it('offers Long and Short with the current side selected', async () => {
    const instance = await render(
      <PositionPill
        coin="BTC"
        price={100}
        side="long"
        onChangeSide={jest.fn()}
      />
    )
    expect(sideMenu(instance).props.groups).toEqual([
      {
        key: 'perp-order-side',
        items: [
          { id: 'long', title: 'Long', selected: true },
          { id: 'short', title: 'Short', selected: false }
        ]
      }
    ])
  })

  it('reports the picked side through onChangeSide', async () => {
    const onChangeSide = jest.fn()
    const instance = await render(
      <PositionPill
        coin="BTC"
        price={100}
        side="long"
        onChangeSide={onChangeSide}
      />
    )
    const menu = sideMenu(instance)

    await act(async () => {
      menu.props.onPressAction({ nativeEvent: { event: 'short' } })
    })
    expect(onChangeSide).toHaveBeenCalledWith('short')
  })

  it('ignores unknown menu events', async () => {
    const onChangeSide = jest.fn()
    const instance = await render(
      <PositionPill
        coin="BTC"
        price={100}
        side="long"
        onChangeSide={onChangeSide}
      />
    )
    const menu = sideMenu(instance)

    await act(async () => {
      menu.props.onPressAction({ nativeEvent: { event: 'bogus' } })
    })
    expect(onChangeSide).not.toHaveBeenCalled()
  })
})
