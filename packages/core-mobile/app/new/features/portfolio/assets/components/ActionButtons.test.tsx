import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { ActionButtonTitle } from '../consts'

const mockOpenDeprecationInfo = jest.fn()
const mockRenderedButtons: Record<string, unknown>[] = []
let mockIsKeystoneDeprecated = false

jest.mock('features/keystone/hooks/useKeystoneDeprecation', () => ({
  useIsActiveWalletKeystoneDeprecated: () => mockIsKeystoneDeprecated,
  useKeystoneDeprecation: () => ({
    isKeystoneDeprecated: mockIsKeystoneDeprecated,
    shouldWarnForWalletType: () => mockIsKeystoneDeprecated,
    openDeprecationInfo: mockOpenDeprecationInfo
  })
}))

// Records the props each button is rendered with, so the assertions can invoke
// the resolved `onPress` directly instead of walking the rendered tree.
jest.mock('@avalabs/k2-alpine', () => ({
  SquareButton: (props: Record<string, unknown>): null => {
    mockRenderedButtons.push(props)
    return null
  },
  SquareButtonIconType: {}
}))

jest.mock('react-native-reanimated', () => {
  const ReactActual = jest.requireActual('react')
  return {
    __esModule: true,
    default: {
      FlatList: ({
        data,
        renderItem
      }: {
        data: unknown[]
        renderItem: (info: { item: unknown; index: number }) => React.ReactNode
      }): React.ReactNode =>
        ReactActual.createElement(
          'FlatList',
          null,
          data.map((item, index) =>
            ReactActual.createElement(
              ReactActual.Fragment,
              { key: index },
              renderItem({ item, index })
            )
          )
        )
    }
  }
})

import { ActionButtons, ActionButton } from './ActionButtons'

const renderAndPress = (
  title: ActionButtonTitle,
  onPress: () => void
): void => {
  const buttons: ActionButton[] = [
    { title, icon: 'send' as ActionButton['icon'], onPress }
  ]

  act(() => {
    renderer.create(<ActionButtons buttons={buttons} />)
  })

  const rendered = mockRenderedButtons.find(props => props.title === title)

  if (!rendered) {
    throw new Error(`no button rendered for ${title}`)
  }

  ;(rendered.onPress as () => void)()
}

describe('ActionButtons keystone gating', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRenderedButtons.length = 0
    mockIsKeystoneDeprecated = false
  })

  it('runs the original action when the active wallet is not Keystone', () => {
    const onPress = jest.fn()

    renderAndPress(ActionButtonTitle.Send, onPress)

    expect(onPress).toHaveBeenCalledTimes(1)
    expect(mockOpenDeprecationInfo).not.toHaveBeenCalled()
  })

  it.each([
    ActionButtonTitle.Send,
    ActionButtonTitle.Swap,
    ActionButtonTitle.Stake,
    ActionButtonTitle.Bridge,
    ActionButtonTitle.Withdraw
  ])(
    'opens the deprecation explainer instead of starting %s for a Keystone wallet',
    title => {
      mockIsKeystoneDeprecated = true
      const onPress = jest.fn()

      renderAndPress(title, onPress)

      expect(mockOpenDeprecationInfo).toHaveBeenCalledTimes(1)
      expect(onPress).not.toHaveBeenCalled()
    }
  )

  it.each([
    ActionButtonTitle.Buy,
    ActionButtonTitle.Receive,
    ActionButtonTitle.Hide,
    ActionButtonTitle.Unhide
  ])('leaves %s working for a Keystone wallet', title => {
    mockIsKeystoneDeprecated = true
    const onPress = jest.fn()

    renderAndPress(title, onPress)

    expect(onPress).toHaveBeenCalledTimes(1)
    expect(mockOpenDeprecationInfo).not.toHaveBeenCalled()
  })
})
