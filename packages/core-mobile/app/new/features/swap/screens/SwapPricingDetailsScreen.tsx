import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  GroupList,
  GroupListItem,
  Icons,
  Logos,
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
import React, { useCallback, useEffect, useMemo } from 'react'
import { FlatList } from 'react-native-gesture-handler'
import { SvgProps } from 'react-native-svg'
import { LocalTokenWithBalance } from 'store/balance/types'
import { useSwapRate } from '../hooks/useSwapRate'
import { MarkrQuote } from '../services/MarkrService'
import {
  isJupiterQuote,
  isMarkrQuote,
  NormalizedSwapQuote,
  NormalizedSwapQuoteResult
} from '../types'

// Provider logo mapping
const PRICE_PROVIDER_ICONS: Record<string, React.FC<SvgProps> | undefined> = {
  velora: Logos.PartnerLogos.Velora,
  odos: Logos.PartnerLogos.Odos,
  kyber: Logos.PartnerLogos.Kyber,
  yak: Logos.PartnerLogos.Yak
}

// Function to get provider logo with fallback
const getPriceProviderIcon = (id: string): React.FC<SvgProps> | null => {
  return PRICE_PROVIDER_ICONS[id] || null
}

export const SwapPricingDetailsScreen = ({
  fromToken,
  toToken,
  quotes,
  setQuotes,
  manuallySelected,
  setManuallySelected
}: {
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
  quotes: NormalizedSwapQuoteResult | undefined
  setQuotes: (quotes: NormalizedSwapQuoteResult) => void
  manuallySelected: boolean
  setManuallySelected: (manuallySelected: boolean) => void
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

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
    (item: NormalizedSwapQuote, index: number): React.JSX.Element => {
      if (!quotes || !quotes.selected) {
        return <></>
      }

      if (!isMarkrQuote(item.quote)) {
        return <></>
      }

      const quote = item.quote as MarkrQuote

      const { id, name } = quote.aggregator
      const isLastItem = index === quotes.quotes.length - 1
      const isSelected =
        (!manuallySelected && index === 0) ||
        (manuallySelected && quotes.selected === item)

      const usdEquivalent =
        id === 'auto'
          ? 0
          : formatInCurrency(toToken, BigInt(item.metadata.amountOut as string))

      // Get the logo for this provider dynamically
      const Icon = getPriceProviderIcon(id)

      return (
        <TouchableOpacity
          key={id}
          sx={{ marginTop: 12 }}
          onPress={() => {
            setManuallySelected(true)
            setQuotes({ ...quotes, selected: item })
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
              {id === 'auto' ? (
                <Icons.Custom.SwapProviderAuto />
              ) : Icon ? (
                <Icon testID={`icon__${id}`} width={36} height={36} />
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
                  {id === 'auto' ? 'Best price available' : usdEquivalent}
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
      quotes,
      toToken,
      formatInCurrency,
      colors,
      manuallySelected,
      setManuallySelected,
      setQuotes
    ]
  )

  const rate = useSwapRate({
    quote: quotes?.selected?.quote,
    fromToken,
    toToken
  })

  const data = useMemo(() => {
    const items: GroupListItem[] = []

    if (
      !fromToken ||
      !toToken ||
      !quotes ||
      quotes.quotes.length === 0 ||
      !quotes.quotes[0] ||
      !quotes.selected
    ) {
      return items
    }

    items.push({
      title: 'Rate',
      value: `1 ${fromToken.symbol} = ${rate?.toFixed(4)} ${toToken.symbol}`
    })

    const bestRate = quotes.quotes[0]
    const selectedRate = quotes.selected

    if (isMarkrQuote(selectedRate.quote)) {
      items.push({
        title: 'Provider',
        value: !manuallySelected
          ? `Auto • ${selectedRate.quote.aggregator.name}`
          : `${selectedRate.quote.aggregator.name}`,
        accordion: (
          <FlatList
            data={[
              {
                ...bestRate,
                quote: {
                  ...bestRate.quote,
                  aggregator: { id: 'auto', name: 'Auto' }
                }
              },
              ...quotes.quotes
            ]}
            keyExtractor={(item): string =>
              ((item as NormalizedSwapQuote).quote as MarkrQuote).aggregator.id
            }
            renderItem={item => renderItem(item.item, item.index)}
            scrollEnabled={false}
          />
        )
      })
    } else if (isJupiterQuote(selectedRate.quote)) {
      items.push({
        title: 'Provider',
        value: `Jupiter`
      })
    }

    return items
  }, [quotes, fromToken, toToken, manuallySelected, renderItem, rate])

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
      <GroupList data={data} separatorMarginRight={16} />
    </ScrollScreen>
  )
}
