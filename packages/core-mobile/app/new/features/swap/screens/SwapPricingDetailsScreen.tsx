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
import { MarkrQuote } from '../types'

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
  selectedRate,
  setSelectedRate,
  bestRate,
  allRates
}: {
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
  selectedRate: MarkrQuote | undefined
  setSelectedRate: (rate: MarkrQuote) => void
  bestRate: MarkrQuote | undefined
  allRates: MarkrQuote[] | undefined
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
      if (allRates === undefined || selectedRate === undefined) {
        return <></>
      }

      const { id, name } = item.aggregator;
      const isLastItem = index === allRates.length - 1
      const isSelected = id === selectedRate.aggregator?.id || (!selectedRate && id === "auto")

      const usdEquivalent = id === 'auto' ? 0 : formatInCurrency(toToken, item.amountOut)
      
      // Get the logo for this provider dynamically
      const Icon = getPriceProviderIcon(id)
      
      return (
        <TouchableOpacity
          key={id}
          sx={{ marginTop: 12 }}
          onPress={() => {
            setSelectedRate(item)
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
    [allRates?.length, selectedRate?.aggregator, colors, setSelectedRate]
  )

  const data = useMemo(() => {
    const items: GroupListItem[] = []

    const activeRate = selectedRate || bestRate;

    if (activeRate === undefined || allRates === undefined || toToken === undefined || fromToken === undefined) {
      return items
    }

    const rate = calculateEvmRate(activeRate); 
    items.push({
      title: 'Rate',
      value: `1 ${fromToken.symbol} = ${rate?.toFixed(4)} ${toToken.symbol}`
    })

    items.push({
      title: 'Provider',
      value: selectedRate?.aggregator!.id === 'auto' ? `Auto • ${bestRate?.aggregator!.name}` : `${selectedRate?.aggregator!.name}`,
      accordion: bestRate ? (
        <FlatList
          data={bestRate ? [{ ...bestRate, aggregator: { id: 'auto', name: 'Auto' } }, ...allRates] : allRates}
          keyExtractor={(item): string => (item as any).aggregator.id}
          renderItem={item => renderItem(item.item, item.index)}
          scrollEnabled={false}
        />
      ) : undefined
    })

    return items
  }, [allRates, selectedRate, renderItem, bestRate])

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
