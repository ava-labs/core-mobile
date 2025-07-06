import React, { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  useTheme,
  View,
  Text,
  GroupList,
  GroupListItem,
  TouchableOpacity,
  Separator,
  Icons,
  Logos
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { FlatList } from 'react-native-gesture-handler'
import { LocalTokenWithBalance } from 'store/balance/types'
import { calculateRate as calculateEvmRate } from '../utils/evm/calculateRate'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { SvgProps } from 'react-native-svg'
import { NormalizedSwapQuote, NormalizedSwapQuoteResult } from '../types'
import { MarkrQuote } from '../services/MarkrService'

// Provider logo mapping
const PRICE_PROVIDER_ICONS: Record<
  string,
  React.FC<SvgProps> | undefined
> = {
  'velora': Logos.PartnerLogos.Velora,
  'odos': Logos.PartnerLogos.Odos,
  'kyber': Logos.PartnerLogos.Kyber,
  'yak': Logos.PartnerLogos.Yak
}

// Function to get provider logo with fallback
const getPriceProviderIcon = (id: string) => {
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
    (item: any, index: number): React.JSX.Element => {
      if (!quotes || !quotes.selected) {
        return <></>
      }

      const { id, name } = item.quote.aggregator;
      const isLastItem = index === quotes.quotes.length - 1
      const isSelected = (!manuallySelected && index === 0) || (manuallySelected && quotes.selected === item)

      const usdEquivalent = id === 'auto' ? 0 : formatInCurrency(toToken, item.metadata.amountOut)
      
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
              { id === 'auto' ? (
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
    [quotes, fromToken, toToken, colors]
  )

  const data = useMemo(() => {
    const items: GroupListItem[] = []

    if (!fromToken || !toToken || !quotes || quotes.quotes.length === 0 || !quotes.quotes[0] || !quotes.selected) {
      return items
    }

    const quote = quotes.selected.quote
    const rate = calculateEvmRate(quote)
    items.push({
      title: 'Rate',
      value: `1 ${fromToken.symbol} = ${rate?.toFixed(4)} ${toToken.symbol}`
    })

    const bestRate = quotes.quotes[0]
    const selectedRate = quotes.selected
    items.push({
      title: 'Provider',
      value:  !manuallySelected ? `Auto • ${(selectedRate.quote as MarkrQuote).aggregator.name}` : `${(selectedRate.quote as MarkrQuote).aggregator.name}`, 
      accordion: <FlatList
          data={[{ ...bestRate, quote: { ...bestRate.quote, aggregator: { id: 'auto', name: 'Auto' } } }, ...quotes.quotes]}
          keyExtractor={(item): string => ((item as NormalizedSwapQuote).quote as MarkrQuote).aggregator.id}
          renderItem={item => renderItem(item.item, item.index)}
          scrollEnabled={false}
        />
    })

    return items
  }, [quotes, renderItem])

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
