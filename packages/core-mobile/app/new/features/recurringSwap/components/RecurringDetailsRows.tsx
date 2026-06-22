import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Modal, Platform, Pressable } from 'react-native'
import {
  Icons,
  Separator,
  showAlert,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import {
  RECURRING_FREQUENCY_VALUE_MAX,
  validateFrequency
} from '@avalabs/fusion-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useSwapContext } from 'features/swap/contexts/SwapContext'
import {
  showAlertWithTextInput,
  dismissAlertWithTextInput
} from 'common/utils/alertWithTextInput'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { formatTokenAmount } from 'utils/Utils'
import { useRecurringSwapContext } from '../contexts/RecurringSwapContext'
import { useRecurringEligibility } from '../hooks/useRecurringEligibility'
import { formatFrequency } from '../utils/formatFrequency'
import {
  FREQUENCY_UNITS,
  UNLIMITED_ORDERS,
  type Frequency,
  type FrequencyUnit,
  type NumberOfOrders
} from '../types'
import { RecurrenceChips, type ChipOption } from './RecurrenceChips'

// ─── Frequency constants ──────────────────────────────────────────────────────

type FreqPresetId = 'hourly' | 'daily' | 'weekly' | 'biweekly' | 'monthly'
type FreqChipId = FreqPresetId | 'custom'

const FREQ_PRESET: Record<FreqPresetId, Frequency> = {
  hourly: { unit: 'hour', value: 1 },
  daily: { unit: 'day', value: 1 },
  weekly: { unit: 'week', value: 1 },
  biweekly: { unit: 'week', value: 2 },
  monthly: { unit: 'month', value: 1 }
}

const FREQ_CHIPS: ChipOption<FreqChipId>[] = [
  { id: 'hourly', label: 'Hourly' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Biweekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'custom', label: 'Custom' }
]

/** Per-unit floor for the custom value input. */
const MIN_FREQ_VALUE: Record<FrequencyUnit, number> = {
  minute: 5,
  hour: 1,
  day: 1,
  week: 1,
  month: 1
}

/** Per-unit cap for the custom value input. */
const MAX_FREQ_VALUE: Record<FrequencyUnit, number> = {
  minute: 60,
  hour: 24,
  day: 30,
  week: 12,
  month: 12
}

const UNIT_LABEL: Record<FrequencyUnit, [string, string]> = {
  minute: ['minute', 'minutes'],
  hour: ['hour', 'hours'],
  day: ['day', 'days'],
  week: ['week', 'weeks'],
  month: ['month', 'months']
}

const UNIT_BUTTON_LABEL: Record<FrequencyUnit, string> = {
  minute: 'Minutes',
  hour: 'Hours',
  day: 'Days',
  week: 'Weeks',
  month: 'Months'
}

const FREQ_INPUT_KEY = 'frequency_value'

function frequencyToChipId(f: Frequency | undefined): FreqChipId | undefined {
  if (!f) return undefined
  if (f.unit === 'hour' && f.value === 1) return 'hourly'
  if (f.unit === 'day' && f.value === 1) return 'daily'
  if (f.unit === 'week' && f.value === 1) return 'weekly'
  if (f.unit === 'week' && f.value === 2) return 'biweekly'
  if (f.unit === 'month' && f.value === 1) return 'monthly'
  return 'custom'
}

// ─── Number-of-orders constants ───────────────────────────────────────────────

type OrdersPresetId = '5' | '10' | '15' | '20'
type OrdersChipId = OrdersPresetId | 'unlimited' | 'custom'

const ORDERS_PRESET: Record<OrdersPresetId, number> = {
  '5': 5,
  '10': 10,
  '15': 15,
  '20': 20
}

const ORDERS_CHIPS: ChipOption<OrdersChipId>[] = [
  { id: '5', label: '5' },
  { id: '10', label: '10' },
  { id: '15', label: '15' },
  { id: '20', label: '20' },
  { id: 'unlimited', label: 'Unlimited' },
  { id: 'custom', label: 'Custom' }
]

const MIN_ORDERS = 2
const DEFAULT_CUSTOM_ORDERS = 5
const ORDERS_INPUT_KEY = 'orders_value'

function ordersToChipId(
  n: NumberOfOrders | undefined
): OrdersChipId | undefined {
  if (n === undefined) return undefined
  if (n === UNLIMITED_ORDERS) return 'unlimited'
  if (n === 5) return '5'
  if (n === 10) return '10'
  if (n === 15) return '15'
  if (n === 20) return '20'
  return 'custom'
}

function formatOrders(n: NumberOfOrders | undefined): string {
  if (n === undefined) return 'Set'
  if (n === UNLIMITED_ORDERS) return 'Unlimited'
  // MIN_ORDERS = 2 in the picker, so a `1` is unreachable from this surface.
  return `${n} orders`
}

// ─── Component ────────────────────────────────────────────────────────────────

type RowKey = 'frequency' | 'orders' | null

type Props = {
  amountPerOrder: bigint | undefined
  fromTokenSymbol: string | undefined
  fromTokenDecimals: number | undefined
}

export function RecurringDetailsRows({
  amountPerOrder,
  fromTokenSymbol,
  fromTokenDecimals
}: Props): JSX.Element {
  const { theme } = useTheme()
  const { frequency, setFrequency, numberOfOrders, setNumberOfOrders } =
    useRecurringSwapContext()
  const { fromToken, toToken } = useSwapContext()
  const activeAccount = useSelector(selectActiveAccount)
  const evmAddress = activeAccount?.addressC

  const eligibility = useRecurringEligibility(fromToken, toToken, evmAddress)
  const minIntervalSeconds = eligibility.eligible
    ? eligibility.minIntervalSeconds
    : 300

  const [expandedRow, setExpandedRow] = useState<RowKey>(null)
  // Android-only: drives the Material-style list dialog for the custom-
  // frequency unit picker. iOS uses `Alert.alert` directly because RN's
  // native iOS Alert renders >2 buttons as a vertical action sheet that
  // already matches the iOS HIG.
  const [androidUnitPickerVisible, setAndroidUnitPickerVisible] =
    useState(false)

  const toggleRow = useCallback((row: Exclude<RowKey, null>) => {
    setExpandedRow(prev => (prev === row ? null : row))
  }, [])

  const collapse = useCallback(() => setExpandedRow(null), [])

  // ── Frequency ─────────────────────────────────────────────────────────────

  const selectedFreqChip = useMemo(
    () => frequencyToChipId(frequency),
    [frequency]
  )

  const promptCustomFrequencyValue = useCallback(
    (unit: FrequencyUnit) => {
      const min = MIN_FREQ_VALUE[unit]
      const max = MAX_FREQ_VALUE[unit]
      const seed =
        frequency?.unit === unit
          ? Math.min(Math.max(min, frequency.value), max)
          : min
      showAlertWithTextInput({
        title: `Every X ${UNIT_LABEL[unit][1]}`,
        description: `Allowed range: ${min} - ${max}`,
        inputs: [
          {
            key: FREQ_INPUT_KEY,
            defaultValue: String(seed),
            keyboardType: 'number-pad'
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            style: 'destructive',
            onPress: dismissAlertWithTextInput
          },
          {
            text: 'Save',
            style: 'default',
            shouldDisable: (values: Record<string, string>) => {
              const raw = values[FREQ_INPUT_KEY]
              const n = raw ? parseInt(raw, 10) : NaN
              if (!Number.isFinite(n) || n < min || n > max) return true
              return !validateFrequency({ unit, value: n }, minIntervalSeconds)
                .ok
            },
            onPress: (values: Record<string, string>) => {
              const raw = values[FREQ_INPUT_KEY]
              const n = raw ? parseInt(raw, 10) : NaN
              if (!Number.isFinite(n)) return
              const next: Frequency = { unit, value: n }
              if (!validateFrequency(next, minIntervalSeconds).ok) return
              setFrequency(next)
              collapse()
            }
          }
        ]
      })
    },
    [frequency, minIntervalSeconds, setFrequency, collapse]
  )

  // Custom-frequency unit picker. Step 1 of 2: pick a unit, then transition
  // to a number-entry dialog (`promptCustomFrequencyValue`). Platform-
  // branched because RN's `Alert.alert` on Android caps at 3 buttons:
  //  - iOS: `showAlert` -> native `Alert.alert`, which renders > 2 buttons
  //    as a vertically stacked native action sheet (HIG-compliant).
  //  - Android: open a Material-style list dialog (title + tappable rows),
  //    which is the platform-standard "pick one from N options" UI.
  const promptCustomFrequencyUnit = useCallback(() => {
    if (Platform.OS === 'android') {
      setAndroidUnitPickerVisible(true)
      return
    }
    showAlert({
      title: 'Custom frequency',
      description: 'Select your custom swap frequency',
      buttons: [
        ...FREQUENCY_UNITS.map(u => ({
          text: UNIT_BUTTON_LABEL[u],
          onPress: (): void => promptCustomFrequencyValue(u)
        })),
        { text: 'Cancel', style: 'destructive' }
      ]
    })
  }, [promptCustomFrequencyValue])

  const handleAndroidUnitPicked = useCallback(
    (u: FrequencyUnit) => {
      setAndroidUnitPickerVisible(false)
      promptCustomFrequencyValue(u)
    },
    [promptCustomFrequencyValue]
  )

  const handleSelectFreqChip = useCallback(
    (id: FreqChipId) => {
      if (id === 'custom') {
        promptCustomFrequencyUnit()
        return
      }
      const next = FREQ_PRESET[id]
      if (!validateFrequency(next, minIntervalSeconds).ok) {
        // Preset is below the chain's floor — surface a native alert instead of
        // silently dropping. Rare in practice (min is 300s by default).
        showAlert({
          title: 'Below minimum interval',
          description: `This network requires at least ${Math.ceil(
            minIntervalSeconds / 60
          )} minutes between swaps.`,
          buttons: [{ text: 'OK' }]
        })
        return
      }
      setFrequency(next)
      collapse()
    },
    [setFrequency, collapse, minIntervalSeconds, promptCustomFrequencyUnit]
  )

  // ── Orders ────────────────────────────────────────────────────────────────

  const selectedOrdersChip = useMemo(
    () => ordersToChipId(numberOfOrders),
    [numberOfOrders]
  )

  const promptCustomOrders = useCallback(() => {
    const seed =
      typeof numberOfOrders === 'number' &&
      numberOfOrders !== UNLIMITED_ORDERS &&
      !Object.values(ORDERS_PRESET).includes(numberOfOrders)
        ? numberOfOrders
        : DEFAULT_CUSTOM_ORDERS
    showAlertWithTextInput({
      title: 'Number of orders',
      description: `Allowed range: ${MIN_ORDERS} - ${RECURRING_FREQUENCY_VALUE_MAX}`,
      inputs: [
        {
          key: ORDERS_INPUT_KEY,
          defaultValue: String(seed),
          keyboardType: 'number-pad'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: dismissAlertWithTextInput
        },
        {
          text: 'Save',
          style: 'default',
          shouldDisable: (values: Record<string, string>) => {
            const raw = values[ORDERS_INPUT_KEY]
            const n = raw ? parseInt(raw, 10) : NaN
            return (
              !Number.isFinite(n) ||
              n < MIN_ORDERS ||
              n > RECURRING_FREQUENCY_VALUE_MAX
            )
          },
          onPress: (values: Record<string, string>) => {
            const raw = values[ORDERS_INPUT_KEY]
            const n = raw ? parseInt(raw, 10) : NaN
            if (!Number.isFinite(n)) return
            setNumberOfOrders(n)
            collapse()
          }
        }
      ]
    })
  }, [numberOfOrders, setNumberOfOrders, collapse])

  const handleSelectOrdersChip = useCallback(
    (id: OrdersChipId) => {
      if (id === 'custom') {
        promptCustomOrders()
        return
      }
      if (id === 'unlimited') {
        setNumberOfOrders(UNLIMITED_ORDERS)
        collapse()
        return
      }
      setNumberOfOrders(ORDERS_PRESET[id])
      collapse()
    },
    [setNumberOfOrders, collapse, promptCustomOrders]
  )

  // ── Estimated total spend ─────────────────────────────────────────────────

  // bigint × number-of-orders, then format. The previous version `parseFloat`-ed
  // a thousands-separated string ("1,234.56" → 1), which dropped totals by 1000x
  // for any amount ≥ 1000 tokens. Compute in the raw unit space, then format
  // once via the shared `formatTokenAmount` helper — default 2 max-fraction
  // digits matches the rest of the app's `formatTokenAmount` usage; sub-cent
  // totals render as "0.00" the same as elsewhere.
  const totalSpend = useMemo(() => {
    if (
      amountPerOrder === undefined ||
      numberOfOrders === undefined ||
      numberOfOrders === UNLIMITED_ORDERS ||
      fromTokenDecimals === undefined ||
      !fromTokenSymbol
    ) {
      return null
    }
    const totalRaw = amountPerOrder * BigInt(numberOfOrders)
    return `${formatTokenAmount(
      bigintToBig(totalRaw, fromTokenDecimals)
    )} ${fromTokenSymbol}`
  }, [amountPerOrder, numberOfOrders, fromTokenSymbol, fromTokenDecimals])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Animated.View
      layout={LinearTransition.easing(Easing.inOut(Easing.ease))}
      style={{
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: theme.colors.$surfaceSecondary
      }}>
      <AndroidUnitListDialog
        visible={androidUnitPickerVisible}
        onSelect={handleAndroidUnitPicked}
        onDismiss={() => setAndroidUnitPickerVisible(false)}
      />
      <CollapsibleRow
        title="Frequency"
        value={formatFrequency(frequency)}
        expanded={expandedRow === 'frequency'}
        onToggle={() => toggleRow('frequency')}
        testID="recurring_row__frequency">
        <View sx={{ padding: 16 }}>
          <RecurrenceChips
            options={FREQ_CHIPS}
            selectedId={selectedFreqChip}
            onSelect={handleSelectFreqChip}
            testID="frequency_chips"
          />
        </View>
      </CollapsibleRow>
      <Separator sx={{ marginLeft: 16 }} />
      <CollapsibleRow
        title="Number of orders"
        value={formatOrders(numberOfOrders)}
        expanded={expandedRow === 'orders'}
        onToggle={() => toggleRow('orders')}
        testID="recurring_row__orders">
        <View sx={{ padding: 16 }}>
          <RecurrenceChips
            options={ORDERS_CHIPS}
            selectedId={selectedOrdersChip}
            onSelect={handleSelectOrdersChip}
            testID="orders_chips"
          />
        </View>
      </CollapsibleRow>
      {totalSpend !== null && (
        <>
          <Separator sx={{ marginLeft: 16 }} />
          <View
            sx={{
              minHeight: 52,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
            <Text
              variant="buttonMedium"
              sx={{ fontFamily: 'Inter-Medium', fontSize: 16 }}>
              Estimated total spend
            </Text>
            <Text variant="body1" sx={{ color: '$textSecondary' }}>
              {totalSpend}
            </Text>
          </View>
        </>
      )}
    </Animated.View>
  )
}

// ─── Local primitives ─────────────────────────────────────────────────────────

function CollapsibleRow({
  title,
  value,
  expanded,
  onToggle,
  children,
  testID
}: {
  title: string
  value: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
  testID?: string
}): JSX.Element {
  return (
    <View>
      <TouchableOpacity
        accessible
        testID={testID}
        onPress={onToggle}
        sx={{
          minHeight: 52,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}>
        <Text
          variant="buttonMedium"
          sx={{ fontFamily: 'Inter-Medium', fontSize: 16 }}>
          {title}
        </Text>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text
            variant="body1"
            numberOfLines={1}
            sx={{ color: '$textSecondary' }}>
            {value}
          </Text>
          <AnimatedChevron expanded={expanded} />
        </View>
      </TouchableOpacity>
      {expanded && (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          {children}
        </Animated.View>
      )}
    </View>
  )
}

// Android Material-style list dialog: title + tappable text rows. Mirrors
// the platform-standard `AlertDialog.Builder.setItems(...)` UI that RN's
// `Alert.alert` doesn't expose (RN only forwards positive / neutral /
// negative buttons, capped at 3). Tapping the backdrop dismisses without
// selecting — matches the Android system behaviour and removes the need
// for an explicit Cancel row.
function AndroidUnitListDialog({
  visible,
  onSelect,
  onDismiss
}: {
  visible: boolean
  onSelect: (unit: FrequencyUnit) => void
  onDismiss: () => void
}): JSX.Element {
  const { theme } = useTheme()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent>
      <Pressable
        onPress={onDismiss}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24
        }}>
        {/* Inner Pressable swallows backdrop taps so taps on the dialog
            body don't dismiss. Width tracks Material's ~280dp min. */}
        <Pressable
          onPress={() => undefined}
          style={{
            width: '100%',
            maxWidth: 360,
            backgroundColor: theme.colors.$surfacePrimary,
            borderRadius: 4,
            paddingVertical: 16,
            elevation: 24
          }}>
          <View sx={{ paddingHorizontal: 24, paddingVertical: 8 }}>
            <Text
              variant="heading6"
              sx={{ fontSize: 20, fontFamily: 'Inter-SemiBold' }}>
              Custom frequency
            </Text>
            <Text
              variant="body2"
              sx={{ color: '$textSecondary', marginTop: 4 }}>
              Select your custom swap frequency
            </Text>
          </View>
          <View sx={{ marginTop: 8 }}>
            {FREQUENCY_UNITS.map(u => (
              <TouchableOpacity
                key={u}
                onPress={() => onSelect(u)}
                testID={`android_unit_${u}`}
                sx={{
                  paddingHorizontal: 24,
                  paddingVertical: 14
                }}>
                <Text variant="body1" sx={{ fontSize: 16 }}>
                  {UNIT_BUTTON_LABEL[u]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Material text-button footer for the negative action. Sits
              outside Android's `setItems` convention (which relies on
              backdrop dismiss), but added back for discoverability. */}
          <View
            sx={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              paddingHorizontal: 8,
              paddingTop: 8
            }}>
            <TouchableOpacity
              onPress={onDismiss}
              testID="android_unit_cancel"
              sx={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 4
              }}>
              <Text
                variant="buttonMedium"
                sx={{
                  fontSize: 14,
                  fontFamily: 'Inter-SemiBold',
                  textTransform: 'uppercase',
                  color: '$textPrimary'
                }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function AnimatedChevron({ expanded }: { expanded: boolean }): JSX.Element {
  const { theme } = useTheme()
  const rotation = useSharedValue(expanded ? 1 : 0)

  useEffect(() => {
    rotation.value = withTiming(expanded ? 1 : 0, { duration: 300 })
  }, [expanded, rotation])

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = `${rotation.value * 180 + 90}deg`
    return { transform: [{ rotate }] }
  })

  return (
    <Animated.View style={[{ marginRight: -6 }, animatedStyle]}>
      <Icons.Navigation.ChevronRight color={theme.colors.$textSecondary} />
    </Animated.View>
  )
}
