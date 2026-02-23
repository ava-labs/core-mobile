import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  GroupList,
  GroupListItem,
  Icons,
  Image,
  Separator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { dismissKeyboardIfNeeded } from 'common/utils/dismissKeyboardIfNeeded'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList } from 'react-native-gesture-handler'
import { LocalTokenWithBalance } from 'store/balance/types'
import { useSwapRate } from '../hooks/useSwapRate'
import { AUTO_QUOTE_ID } from '../consts'
import type { Quote } from '../types'

export const SwapPricingDetailsScreen = ({
  bestQuote,
  userQuote,
  fromToken,
  toToken,
  selectedQuote,
  allQuotes,
  selectQuoteById
}: {
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
  bestQuote: Quote | null
  userQuote: Quote | null
  selectedQuote: Quote | null
  allQuotes: Quote[]
  selectQuoteById: (quoteId: string | null) => void
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [isAccordionExpanded, setIsAccordionExpanded] = useState(false)
  const [accordionResetKey, setAccordionResetKey] = useState(0)

  const { formatCurrency } = useFormatCurrency()

  const formatInCurrency = useCallback(
    (
      token: LocalTokenWithBalance | undefined,
      value: bigint | undefined
    ): string => {
      if (token?.priceInCurrency === undefined || !('decimals' in token)) {
        return UNKNOWN_AMOUNT
      }

      return formatCurrency({
        amount: new TokenUnit(value ?? 0n, token.decimals, token.symbol)
          .mul(token.priceInCurrency)
          .toDisplay({ asNumber: true })
      })
    },
    [formatCurrency]
  )

  const renderItem = useCallback(
    (item: Quote, index: number): React.JSX.Element => {
      if (!bestQuote) {
        return <></>
      }

      const { id, name, logoUrl } = item.aggregator

      const isLastItem = index === allQuotes.length
      // Check if this is the Auto item or a specific provider
      const isAutoItem = id === AUTO_QUOTE_ID
      const isSelected = isAutoItem
        ? !userQuote // Auto is selected when no manual selection
        : userQuote?.id === item.id // Specific provider is selected when it matches userQuote

      const usdEquivalent =
        id === AUTO_QUOTE_ID ? 0 : formatInCurrency(toToken, item.amountOut)

      return (
        <TouchableOpacity
          key={id}
          sx={{ marginTop: 12 }}
          onPress={() => {
            if (id === AUTO_QUOTE_ID) {
              selectQuoteById(null) // Select Auto mode
            } else {
              selectQuoteById(item.id) // Select specific quote
            }
            setAccordionResetKey(prev => prev + 1)
            setIsAccordionExpanded(false)
          }}>
          <View
            sx={{
              paddingLeft: 16,
              paddingRight: 12,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12
            }}>
            <View
              sx={{
                width: 36,
                height: 36,
                borderRadius: 18,
                overflow: 'hidden',
                backgroundColor: colors.$surfaceSecondary,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
              {id === AUTO_QUOTE_ID ? (
                <Icons.Custom.SwapProviderAuto />
              ) : logoUrl ? (
                <Image
                  source={{ uri: logoUrl }}
                  testID={`icon__${id}`}
                  sx={{
                    borderRadius: 18,
                    width: 36,
                    height: 36
                  }}
                />
              ) : (
                <Text variant="body2" sx={{ color: colors.$textSecondary }}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View
              sx={{
                flexGrow: 1,
                marginHorizontal: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
              <View
                sx={{
                  flexShrink: 1
                }}>
                <Text variant="buttonMedium" numberOfLines={1} sx={{ flex: 1 }}>
                  {name}
                </Text>
                <Text
                  testID={`provider__${id}`}
                  variant="body2"
                  sx={{ lineHeight: 16, flex: 1 }}
                  ellipsizeMode="tail"
                  numberOfLines={1}>
                  {id === AUTO_QUOTE_ID
                    ? 'Best price available'
                    : usdEquivalent}
                </Text>
              </View>
              {isSelected && (
                <Icons.Navigation.Check
                  testID={`selected_provider__${id}`}
                  color={colors.$textPrimary}
                />
              )}
            </View>
          </View>
          {!isLastItem && (
            <View sx={{ marginLeft: 62 }}>
              <Separator />
            </View>
          )}
        </TouchableOpacity>
      )
    },
    [
      bestQuote,
      userQuote,
      allQuotes,
      toToken,
      formatInCurrency,
      colors,
      selectQuoteById
    ]
  )

  const rate = useSwapRate({
    quote: selectedQuote,
    fromToken,
    toToken
  })

  const selectedRateData = useMemo(() => {
    if (!fromToken || !toToken) {
      return []
    }

    return [
      {
        title: 'Rate',
        value: `1 ${fromToken.symbol} = ${rate?.toFixed(4)} ${toToken.symbol}`
      }
    ]
  }, [fromToken, toToken, rate])

  const providerData = useMemo(() => {
    const items: GroupListItem[] = []

    if (allQuotes.length === 0 || !selectedQuote || !bestQuote) {
      return items
    }

    items.push({
      title: 'Provider',
      value: !userQuote
        ? `Auto • ${selectedQuote.aggregator.name}`
        : `${selectedQuote.aggregator.name}`,
      expanded: isAccordionExpanded,
      accordion: (
        <FlatList
          data={[
            {
              ...bestQuote,
              aggregator: {
                ...bestQuote.aggregator,
                id: AUTO_QUOTE_ID,
                name: 'Auto'
              }
            } as Quote,
            ...allQuotes
          ]}
          keyExtractor={(item): string => item.aggregator.id}
          renderItem={item => renderItem(item.item, item.index)}
          scrollEnabled={false}
        />
      )
    })

    return items
  }, [
    bestQuote,
    userQuote,
    allQuotes,
    isAccordionExpanded,
    renderItem,
    selectedQuote
  ])

  useEffect(() => {
    setTimeout(() => {
      dismissKeyboardIfNeeded()
    }, 0)
  }, [])

  return (
    <ScrollScreen
      title={`Pricing details`}
      navigationTitle="Pricing details"
      isModal
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ paddingTop: 24, gap: 10 }}>
        <GroupList data={selectedRateData} separatorMarginRight={16} />
        <GroupList
          data={providerData}
          separatorMarginRight={16}
          key={`accordion-${accordionResetKey}`}
        />
      </View>
    </ScrollScreen>
  )
}
