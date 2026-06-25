import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  GroupList,
  GroupListItem,
  Icons,
  Image,
  Separator,
  Text,
  Tooltip,
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
import type { QuoteFees } from '@avalabs/fusion-sdk'
import { useSwapRate } from '../hooks/useSwapRate'
import { useQuoteFees } from '../hooks/useQuoteFees'
import { AUTO_QUOTE_ID } from '../consts'
import type { Quote } from '../types'

/**
 * Communicates the state of the recurring-swap "schedule fee" line item.
 *
 *   undefined    — Not in recurring mode, or the fee is already loaded into
 *                  `extraFees` (renders normally as part of the breakdown).
 *   'set-inputs' — User has recurring on but hasn't picked frequency/orders
 *                  (or hasn't typed an amount), so the schedule fee can't
 *                  be quoted yet.
 *   'updating'   — Inputs are complete and a fresh quote is in flight.
 *                  Renders a small spinner on the row + an "updating…" hint
 *                  in the tooltip body.
 */
export type SchedulePromptType = 'set-inputs' | 'updating' | undefined

const SCHEDULE_FEE_LABEL = 'Schedule fee'
const SCHEDULE_PROMPT_COPY: Record<NonNullable<SchedulePromptType>, string> = {
  'set-inputs': `${SCHEDULE_FEE_LABEL}: set frequency & orders to calculate`,
  updating: `${SCHEDULE_FEE_LABEL}: updating…`
}

export const SwapPricingDetailsScreen = ({
  bestQuote,
  userQuote,
  fromToken,
  toToken,
  selectedQuote,
  allQuotes,
  selectQuoteById,
  extraFees,
  schedulePromptType
}: {
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
  bestQuote: Quote | null
  userQuote: Quote | null
  selectedQuote: Quote | null
  allQuotes: Quote[]
  selectQuoteById: (quoteId: string | null) => void
  /** Additional fees not present on `selectedQuote.fees`. The recurring-swap
   *  schedule fee lives on the recurring quote (not the active swap quote),
   *  so the route layer threads it in here to surface it as a line item in
   *  the "Fees" tooltip. */
  extraFees?: QuoteFees
  /** When set, augments the Fees row to communicate that the recurring
   *  schedule fee isn't yet computable (`'set-inputs'`) or is currently
   *  being recomputed (`'updating'`). See {@link SchedulePromptType}. */
  schedulePromptType?: SchedulePromptType
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [isAccordionExpanded, setIsAccordionExpanded] = useState(false)
  const [accordionResetKey, setAccordionResetKey] = useState(0)

  const { formatCurrency } = useFormatCurrency()
  const mergedFees = useMemo<QuoteFees | undefined>(() => {
    const base = selectedQuote?.fees
    if (!extraFees?.length) return base
    return base ? ([...base, ...extraFees] as QuoteFees) : extraFees
  }, [selectedQuote?.fees, extraFees])
  const totalFees = useQuoteFees(mergedFees)

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

    const items: GroupListItem[] = [
      {
        title: 'Rate',
        value: `1 ${fromToken.symbol} = ${rate?.toFixed(4)} ${toToken.symbol}`
      }
    ]

    // Schedule fee is unresolved (inputs missing or currently fetching) —
    // surface a row even when there are no other fees to show, so the user
    // sees the state instead of an empty Pricing-details modal.
    const hasFeeData = totalFees !== undefined
    const hasPrompt = schedulePromptType !== undefined
    if (!hasFeeData && !hasPrompt) return items

    const breakdownLines = hasFeeData
      ? totalFees.breakdown.map(item =>
          item.fiatAmount != null
            ? `${item.name}: ${formatCurrency({
                amount: item.fiatAmount,
                showLessThanThreshold: true
              })}`
            : `${item.name}: ${item.tokenAmount}`
        )
      : []
    if (hasPrompt) {
      // When loaded, the schedule fee is already in `breakdown` via
      // `extraFees`. The prompt only fires for missing-inputs/updating.
      breakdownLines.push(SCHEDULE_PROMPT_COPY[schedulePromptType])
    }
    const breakdownDescription = breakdownLines.join('\n')

    const isUpdating = schedulePromptType === 'updating'
    const totalLabel = hasFeeData
      ? formatCurrency({
          amount: totalFees.total,
          showLessThanThreshold: true
        })
      : UNKNOWN_AMOUNT
    const valueNode =
      isUpdating || schedulePromptType === 'set-inputs' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text variant="body1" sx={{ color: '$textSecondary' }}>
            {totalLabel}
          </Text>
          {isUpdating && (
            <ActivityIndicator
              size="small"
              testID="schedule_fee_updating_spinner"
            />
          )}
        </View>
      ) : (
        totalLabel
      )

    const breakdownLineCount =
      (hasFeeData ? totalFees.breakdown.length : 0) + (hasPrompt ? 1 : 0)
    items.push({
      title: breakdownLineCount === 1 ? 'Fee' : 'Fees',
      rightIcon: (
        <Tooltip title="Fee Breakdown" description={breakdownDescription} />
      ),
      value: valueNode
    })

    return items
  }, [fromToken, toToken, rate, totalFees, formatCurrency, schedulePromptType])

  const providerData = useMemo(() => {
    const items: GroupListItem[] = []

    if (allQuotes.length === 0 || !selectedQuote || !bestQuote) {
      return items
    }

    const haveMultipleQuotes = allQuotes.length > 1
    items.push({
      title: 'Provider',
      value: !userQuote
        ? `Auto • ${selectedQuote.aggregator.name}`
        : `${selectedQuote.aggregator.name}`,
      ...(haveMultipleQuotes && {
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
