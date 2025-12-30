import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Button,
  GroupList,
  GroupListItem,
  Text,
  TextInput,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { dismissKeyboardIfNeeded } from 'common/utils/dismissKeyboardIfNeeded'
import { isSlippageValid } from '../utils/isSlippageValid'
import { SwapProviders } from '../types'

const MIN_SLIPPAGE = 0.1
const PRESET_SLIPPAGES = [0.2, 0.5, 1, 2] as const

interface SwapSlippageDetailsScreenProps {
  slippage: number
  setSlippage: (slippage: number) => void
  autoSlippage: boolean
  setAutoSlippage: (autoSlippage: boolean) => void
  provider?: SwapProviders
}

export const SwapSlippageDetailsScreen = ({
  slippage,
  setSlippage,
  autoSlippage,
  setAutoSlippage,
  provider
}: SwapSlippageDetailsScreenProps): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const [localSlippage, setLocalSlippage] = useState(slippage)
  const [isCustom, setIsCustom] = useState(
    !PRESET_SLIPPAGES.includes(slippage as never)
  )
  const [customInput, setCustomInput] = useState(String(slippage))
  const [error, setError] = useState<string | null>(null)

  // Sync local state when slippage changes
  useEffect(() => {
    setLocalSlippage(slippage)
    setCustomInput(String(slippage))
    setIsCustom(!PRESET_SLIPPAGES.includes(slippage as never))
    setError(null)
  }, [slippage])

  const handleAutoToggle = useCallback(() => {
    const newAutoState = !autoSlippage
    setAutoSlippage(newAutoState)

    // When enabling auto slippage, it will be updated by the context
    if (!newAutoState) {
      // When disabling auto, keep current slippage
      setSlippage(localSlippage)
    }
  }, [autoSlippage, localSlippage, setAutoSlippage, setSlippage])

  const handlePresetClick = useCallback(
    (preset: number) => {
      setLocalSlippage(preset)
      setSlippage(preset)
      setIsCustom(false)
      setAutoSlippage(false)
      setError(null)
    },
    [setSlippage, setAutoSlippage]
  )

  const handleCustomClick = useCallback(() => {
    setIsCustom(true)
    setAutoSlippage(false)
    setError(null)
  }, [setAutoSlippage])

  const handleCustomInputChange = useCallback(
    (value: string) => {
      setCustomInput(value)
      setAutoSlippage(false)

      const numValue = parseFloat(value)
      if (!Number.isNaN(numValue) && numValue > 100) {
        setError('Slippage must be less than or equal to 100%')
        return
      }
      setError(null)

      if (isSlippageValid(value)) {
        setLocalSlippage(numValue)
      }
    },
    [setAutoSlippage]
  )

  const handleCustomInputBlur = useCallback(() => {
    const numValue = parseFloat(customInput)

    if (!Number.isNaN(numValue) && numValue > 100) {
      setCustomInput(String(MIN_SLIPPAGE))
      setSlippage(MIN_SLIPPAGE)
      setLocalSlippage(MIN_SLIPPAGE)
      setError(null)
      return
    }

    if (isSlippageValid(customInput)) {
      setSlippage(numValue)
      setLocalSlippage(numValue)
    } else {
      setCustomInput(String(MIN_SLIPPAGE))
      setSlippage(MIN_SLIPPAGE)
      setLocalSlippage(MIN_SLIPPAGE)
      setError(null)
    }
  }, [customInput, setSlippage])

  const displayValue = autoSlippage ? `Auto • ${slippage}%` : `${slippage}%`
  const isSlippageApplicable = provider !== SwapProviders.WNATIVE

  const currentSlippageData: GroupListItem[] = useMemo(
    () => [
      {
        title: 'Slippage',
        value: displayValue
      }
    ],
    [displayValue]
  )

  const autoSlippageData: GroupListItem[] = useMemo(
    () =>
      isSlippageApplicable
        ? [
            {
              title: 'Auto slippage',
              description:
                'Core will find the lowest slippage for a successful swap',
              accessory: (
                <TouchableOpacity onPress={handleAutoToggle}>
                  <Text
                    variant="buttonMedium"
                    sx={{
                      color: autoSlippage
                        ? colors.$textSuccess
                        : colors.$textSecondary
                    }}>
                    {autoSlippage ? 'On' : 'Off'}
                  </Text>
                </TouchableOpacity>
              )
            }
          ]
        : [],
    [isSlippageApplicable, autoSlippage, handleAutoToggle, colors]
  )

  useEffect(() => {
    setTimeout(() => {
      dismissKeyboardIfNeeded()
    }, 0)
  }, [])

  return (
    <ScrollScreen
      title="Slippage details"
      navigationTitle="Slippage details"
      isModal
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ paddingTop: 24, gap: 10 }}>
        <GroupList data={currentSlippageData} separatorMarginRight={16} />

        {isSlippageApplicable && (
          <>
            <GroupList data={autoSlippageData} separatorMarginRight={16} />

            <View
              sx={{
                backgroundColor: colors.$surfaceSecondary,
                borderRadius: 12,
                padding: 16
              }}>
              <Text variant="body2" sx={{ marginBottom: 4 }}>
                Manual slippage
              </Text>
              <Text
                variant="caption"
                sx={{ color: colors.$textSecondary, marginBottom: 12 }}>
                Your transaction will fail if the price changes more than the
                slippage
              </Text>

              <View
                sx={{
                  flexDirection: 'row',
                  gap: 8
                }}>
                {PRESET_SLIPPAGES.map(preset => (
                  <Button
                    key={preset}
                    type={
                      !isCustom && localSlippage === preset
                        ? 'primary'
                        : 'secondary'
                    }
                    size="large"
                    onPress={() => {
                      handlePresetClick(preset)
                    }}
                    style={{
                      flex: 1,
                      height: 46
                    }}>
                    {preset}%
                  </Button>
                ))}

                {isCustom ? (
                  <View
                    sx={{
                      flex: 1,
                      height: 46,
                      borderRadius: 8,
                      backgroundColor: colors.$surfacePrimary,
                      borderWidth: 2,
                      borderColor: colors.$textPrimary,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 8
                    }}>
                    <TextInput
                      value={customInput}
                      onChangeText={handleCustomInputChange}
                      onBlur={handleCustomInputBlur}
                      keyboardType="numeric"
                      autoFocus
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        color: colors.$textPrimary,
                        fontSize: 14,
                        fontWeight: '500'
                      }}
                      placeholder={String(MIN_SLIPPAGE)}
                      placeholderTextColor={colors.$textSecondary}
                    />
                    <Text
                      variant="body2"
                      sx={{
                        color: colors.$textPrimary,
                        fontWeight: 500
                      }}>
                      %
                    </Text>
                  </View>
                ) : (
                  <Button
                    type="secondary"
                    size="large"
                    onPress={handleCustomClick}
                    style={{
                      flex: 1,
                      height: 46
                    }}>
                    Custom
                  </Button>
                )}
              </View>
            </View>
          </>
        )}

        {error && (
          <View
            sx={{
              alignItems: 'center',
              width: '100%'
            }}>
            <Text
              variant="caption"
              sx={{
                textAlign: 'center',
                color: colors.$textDanger,
                fontWeight: 500
              }}>
              {error}
            </Text>
          </View>
        )}
      </View>
    </ScrollScreen>
  )
}
