import React, { useState, useEffect, useCallback } from 'react'
import {
  Button,
  Separator,
  Text,
  Toggle,
  useInversedTheme,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { normalizeNumericTextInput } from '@avalabs/k2-alpine/src/utils/tokenUnitInput'
import { useRouter } from 'expo-router'
import { ScrollScreen } from 'common/components/ScrollScreen'
import {
  dismissAlertWithTextInput,
  showAlertWithTextInput
} from 'common/utils/alertWithTextInput'
import { isSlippageValid } from '../utils/isSlippageValid'
import { SwapProviders } from '../types'

const CUSTOM_SLIPPAGE_INPUT_KEY = 'customSlippage'
const PRESET_SLIPPAGES = [1, 2] as const

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
    theme: { colors, isDark }
  } = useTheme()
  const {
    theme: { colors: inversedColors }
  } = useInversedTheme({ isDark })
  const router = useRouter()

  const [localSlippage, setLocalSlippage] = useState(slippage)
  const [isCustom, setIsCustom] = useState(
    !PRESET_SLIPPAGES.includes(slippage as never)
  )

  // Sync local state when slippage changes
  useEffect(() => {
    setLocalSlippage(slippage)
    setIsCustom(!PRESET_SLIPPAGES.includes(slippage as never))
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
    },
    [setSlippage, setAutoSlippage]
  )

  const sanitizeInput = useCallback(
    ({ text }: { text: string; key: string }): string => {
      const normalizedInput = normalizeNumericTextInput(text)
      return normalizedInput.startsWith('.') ? '0.' : normalizedInput
    },
    []
  )

  const handleCustomClick = useCallback(() => {
    showAlertWithTextInput({
      title: 'Define custom slippage',
      description: 'Allowed range: 0.1% - 50%',
      inputs: [
        {
          key: CUSTOM_SLIPPAGE_INPUT_KEY,
          defaultValue: isCustom ? slippage.toString() : '',
          keyboardType: 'numeric',
          sanitize: sanitizeInput
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          onPress: dismissAlertWithTextInput
        },
        {
          text: 'Save',
          style: 'default',
          shouldDisable: (values: Record<string, string>) => {
            const value = values[CUSTOM_SLIPPAGE_INPUT_KEY]
            const isEmpty = !value || value.length === 0
            const isInvalid = value ? !isSlippageValid(value) : true
            return isEmpty || isInvalid
          },
          onPress: (values: Record<string, string>) => {
            const enteredValue = values[CUSTOM_SLIPPAGE_INPUT_KEY]
            if (enteredValue) {
              const numValue = Number(enteredValue)
              setSlippage(numValue)
              setLocalSlippage(numValue)
              setIsCustom(true)
              setAutoSlippage(false)
            }
          }
        }
      ]
    })
  }, [isCustom, slippage, sanitizeInput, setSlippage, setAutoSlippage])

  const displayValue = autoSlippage ? `Auto • ${slippage}%` : `${slippage}%`
  const isSlippageApplicable = provider !== SwapProviders.WNATIVE

  const handleDone = useCallback(() => {
    router.back()
  }, [router])

  return (
    <ScrollScreen
      title="Slippage details"
      navigationTitle="Slippage details"
      isModal
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View sx={{ paddingTop: 24, gap: 16, flex: 1 }}>
        {/* Unified Card */}
        <View
          sx={{
            backgroundColor: colors.$surfaceSecondary,
            borderRadius: 12,
            overflow: 'hidden'
          }}>
          {/* Slippage Row */}
          <View
            sx={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16
            }}>
            <Text
              sx={{
                fontSize: 16,
                fontWeight: '400',
                lineHeight: 22
              }}>
              Slippage
            </Text>
            <Text
              sx={{
                color: colors.$textSecondary,
                fontSize: 16,
                fontWeight: '400',
                lineHeight: 22,
                textAlign: 'right'
              }}>
              {displayValue}
            </Text>
          </View>

          {isSlippageApplicable && (
            <>
              <Separator />

              {/* Auto Slippage Row */}
              <View
                sx={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16
                }}>
                <View sx={{ flex: 1, marginRight: 16 }}>
                  <Text
                    sx={{
                      fontSize: 16,
                      fontWeight: '400',
                      lineHeight: 22
                    }}>
                    Auto slippage
                  </Text>
                  <Text
                    variant="caption"
                    sx={{
                      color: colors.$textSecondary,
                      marginTop: 4,
                      fontSize: 13
                    }}>
                    Core will find the lowest slippage for a successful swap
                  </Text>
                </View>
                <Toggle value={autoSlippage} onValueChange={handleAutoToggle} />
              </View>

              <Separator />

              {/* Manual Slippage Section */}
              <View sx={{ padding: 16 }}>
                <Text
                  sx={{
                    fontSize: 16,
                    fontWeight: '400',
                    lineHeight: 22
                  }}>
                  Manual slippage
                </Text>
                <Text
                  variant="caption"
                  sx={{
                    color: colors.$textSecondary,
                    marginTop: 4,
                    fontSize: 13
                  }}>
                  Your transaction will fail if the price changes more than the
                  slippage
                </Text>

                <View
                  sx={{
                    flexDirection: 'row',
                    gap: 8,
                    marginTop: 12
                  }}>
                  {PRESET_SLIPPAGES.map(preset => {
                    const isSelected =
                      !autoSlippage && !isCustom && localSlippage === preset
                    return (
                      <Button
                        key={preset}
                        type={isSelected ? 'primary' : 'secondary'}
                        size="large"
                        onPress={() => {
                          handlePresetClick(preset)
                        }}
                        style={{
                          flex: 1,
                          height: 46,
                          borderRadius: 10
                        }}>
                        <Text
                          sx={{
                            color: isSelected
                              ? inversedColors.$textPrimary
                              : colors.$textPrimary,
                            fontSize: 15,
                            fontWeight: '500',
                            lineHeight: 20,
                            textAlign: 'center'
                          }}>
                          {preset}%
                        </Text>
                      </Button>
                    )
                  })}

                  <Button
                    type={!autoSlippage && isCustom ? 'primary' : 'secondary'}
                    size="large"
                    onPress={handleCustomClick}
                    style={{
                      flex: 1,
                      height: 46,
                      borderRadius: 10
                    }}>
                    {!autoSlippage && isCustom ? (
                      <View
                        sx={{
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%'
                        }}>
                        <Text
                          sx={{
                            color: inversedColors.$textPrimary,
                            fontSize: 11,
                            fontWeight: '400',
                            lineHeight: 14,
                            textAlign: 'center'
                          }}>
                          Custom
                        </Text>
                        <Text
                          sx={{
                            color: inversedColors.$textPrimary,
                            fontSize: 15,
                            fontWeight: '500',
                            lineHeight: 20,
                            textAlign: 'center'
                          }}>
                          {localSlippage}%
                        </Text>
                      </View>
                    ) : (
                      <Text
                        sx={{
                          color: colors.$textPrimary,
                          fontSize: 15,
                          fontWeight: '500',
                          lineHeight: 20,
                          textAlign: 'center'
                        }}>
                        Custom
                      </Text>
                    )}
                  </Button>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Done Button */}
        <View sx={{ flex: 1, justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            size="large"
            onPress={handleDone}
            style={{ width: '100%' }}>
            Done
          </Button>
        </View>
      </View>
    </ScrollScreen>
  )
}
