import React from 'react'
import renderer, { act } from 'react-test-renderer'

const mockOpenUrl = jest.fn()
jest.mock('common/hooks/useCoreBrowser', () => ({
  useCoreBrowser: () => ({ openUrl: mockOpenUrl })
}))

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Button: ({ children, onPress, testID }: any) =>
      r.createElement(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rn.TouchableOpacity as any,
        { onPress, testID },
        r.createElement(rn.Text, null, children)
      ),
    Icons: { Alert: { ErrorOutline: () => null } },
    useTheme: () => ({
      theme: { isDark: true, colors: { $textDanger: '#E84142' } }
    })
  }
})

import { PerpsGeoRestrictionWarning } from './PerpsGeoRestrictionWarning'

const PERPS_HELP_URL =
  'https://support.core.app/en/articles/15591330-core-mobile-what-are-perpetual-futures'

describe('<PerpsGeoRestrictionWarning />', () => {
  beforeEach(() => mockOpenUrl.mockReset())

  it('shows the geo-restriction copy', async () => {
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(<PerpsGeoRestrictionWarning />)
    })
    expect(JSON.stringify(instance.toJSON())).toContain(
      'Perpetual Futures may be restricted in your location due to local regulations.'
    )
  })

  it('opens the perps help article when Learn more is pressed', async () => {
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(<PerpsGeoRestrictionWarning />)
    })
    const button = instance.root.findByProps({ testID: 'perps-geo-learn-more' })
    await act(async () => {
      button.props.onPress()
    })
    expect(mockOpenUrl).toHaveBeenCalledWith({
      url: PERPS_HELP_URL,
      title: expect.any(String)
    })
  })
})
