import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { ServiceProviderCategories } from '../consts'

jest.mock('react-redux', () => ({
  useSelector: () => 'BRL'
}))

jest.mock('../hooks/useSelectAmount', () => ({
  useSelectAmount: () => ({
    formatInSubTextNumber: jest.fn(),
    sourceAmount: 0,
    setSourceAmount: jest.fn(),
    paymentMethodToDisplay: undefined,
    serviceProviderToDisplay: undefined,
    isEnabled: false,
    token: {
      tokenWithBalance: {
        symbol: 'AVAX',
        balanceCurrencyDisplayValue: undefined
      }
    },
    tokenBalance: 1,
    hasValidSourceAmount: false,
    isLoadingDefaultsByCountry: false,
    isLoadingTradeLimits: false,
    createSessionWidget: jest.fn(),
    isLoadingCryptoQuotes: false,
    errorMessage: undefined
  })
}))

jest.mock('common/hooks/useFormatCurrency', () => ({
  useFormatCurrency: () => ({
    formatCurrency: ({ amount }: { amount: number }) => `R$${amount}`,
    formatIntegerCurrency: ({ amount }: { amount: number }) => `R$${amount}`
  })
}))

jest.mock('@avalabs/k2-alpine', () => {
  const react = require('react') as typeof import('react')
  const rn = require('react-native') as typeof import('react-native')
  const pass =
    (Component: React.ElementType) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ children, sx: _sx, variant: _variant, ...props }: any) =>
      react.createElement(Component, props, children)

  return {
    ActivityIndicator: () => null,
    Button: pass(rn.View),
    FiatAmountInputWidget: () => null,
    Icons: {
      Alert: { AlertCircle: () => null },
      Navigation: { ChevronRightV2: () => null }
    },
    Pressable: pass(rn.Pressable),
    showAlert: jest.fn(),
    Text: pass(rn.Text),
    useInversedTheme: () => ({ theme: { colors: {} } }),
    useTheme: () => ({
      theme: { colors: {}, isDark: false }
    }),
    View: pass(rn.View)
  }
})

jest.mock('common/components/ScrollScreen', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ScrollScreen: ({ children }: any) => children
}))
jest.mock('common/hooks/useInAppBrowser', () => () => ({ openUrl: jest.fn() }))
jest.mock('common/utils/dismissKeyboardIfNeeded', () => ({
  dismissKeyboardIfNeeded: jest.fn()
}))
jest.mock('features/portfolio/assets/components/LogoWithNetwork', () => ({
  LogoWithNetwork: () => null
}))
jest.mock('../hooks/useResetMeldTokenList', () => ({
  useResetMeldTokenList: jest.fn()
}))
jest.mock('../store', () => ({
  useOfframpActivityIndicator: () => ({ animating: false }),
  useOfframpSessionId: () => ({ setSessionId: jest.fn() })
}))

import { SelectAmount } from './SelectAmount'

it('renders a missing fiat balance as zero instead of NaN', async () => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(
      <SelectAmount
        title="How much do you want to buy?"
        navigationTitle="Enter buy amount"
        category={ServiceProviderCategories.CRYPTO_ONRAMP}
        onSelectToken={jest.fn()}
        onSelectPaymentMethod={jest.fn()}
      />
    )
  })

  const output = JSON.stringify(instance.toJSON())
  expect(output).toContain('R$0')
  expect(output).not.toContain('NaN')
})
