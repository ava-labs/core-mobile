import React, { useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Text, Button, useTheme } from '@avalabs/k2-alpine'
import { LedgerDerivationPathType } from 'services/wallet/LedgerWallet'

interface DerivationPathOption {
  type: LedgerDerivationPathType
  title: string
  subtitle: string
  benefits: string[]
  warnings: string[]
  recommended?: boolean
  setupTime: string
  newAccountRequirement: string
}

interface DerivationPathSelectorProps {
  onSelect: (derivationPathType: LedgerDerivationPathType) => void
  onCancel?: () => void
}

const derivationPathOptions: DerivationPathOption[] = [
  {
    type: LedgerDerivationPathType.BIP44,
    title: 'BIP44 (Recommended)',
    subtitle: 'Standard approach for most users',
    benefits: [
      'Faster setup (~15 seconds)',
      'Create new accounts without device',
      'Industry standard approach',
      'Better for multiple accounts'
    ],
    warnings: ['Stores extended keys locally'],
    recommended: true,
    setupTime: '~15 seconds',
    newAccountRequirement: 'No device needed'
  },
  {
    type: LedgerDerivationPathType.LedgerLive,
    title: 'Ledger Live',
    subtitle: 'Maximum security approach',
    benefits: [
      'No extended keys stored',
      'Each account explicitly authorized',
      'Compatible with Ledger Live',
      'Maximum security model'
    ],
    warnings: ['Longer setup time', 'Device required for new accounts'],
    setupTime: '~45 seconds',
    newAccountRequirement: 'Device connection required'
  }
]

export const DerivationPathSelector: React.FC<DerivationPathSelectorProps> = ({
  onSelect,
  onCancel
}) => {
  const {
    theme: { colors }
  } = useTheme()
  const [selectedType, setSelectedType] =
    useState<LedgerDerivationPathType | null>(null)

  const handleOptionPress = (type: LedgerDerivationPathType) => {
    setSelectedType(type)
  }

  const handleContinue = () => {
    if (selectedType) {
      onSelect(selectedType)
    }
  }

  return (
    <View style={{ flex: 1, padding: 24 }}>
      {/* Header */}
      <View style={{ marginBottom: 32 }}>
        <Text variant="heading4" style={{ marginBottom: 8 }}>
          Choose Setup Method
        </Text>
        <Text variant="body1" style={{ color: colors.$textSecondary }}>
          Select how you'd like to set up your Ledger wallet. Both options are
          secure.
        </Text>
      </View>

      {/* Options */}
      <View style={{ flex: 1 }}>
        {derivationPathOptions.map(option => (
          <TouchableOpacity
            key={option.type}
            style={{
              borderWidth: 2,
              borderColor:
                selectedType === option.type
                  ? colors.$textPrimary
                  : colors.$borderPrimary,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              backgroundColor:
                selectedType === option.type
                  ? colors.$surfaceSecondary
                  : colors.$surfacePrimary
            }}
            onPress={() => handleOptionPress(option.type)}>
            {/* Header with recommendation badge */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8
              }}>
              <Text variant="heading6" style={{ flex: 1 }}>
                {option.title}
              </Text>
              {option.recommended && (
                <View
                  style={{
                    backgroundColor: colors.$textSuccess,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 12
                  }}>
                  <Text variant="caption" style={{ color: colors.$white }}>
                    RECOMMENDED
                  </Text>
                </View>
              )}
            </View>

            {/* Subtitle */}
            <Text
              variant="body2"
              style={{ color: colors.$textSecondary, marginBottom: 16 }}>
              {option.subtitle}
            </Text>

            {/* Quick stats */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 16,
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: colors.$surfaceSecondary,
                borderRadius: 8
              }}>
              <View style={{ flex: 1 }}>
                <Text
                  variant="caption"
                  style={{ color: colors.$textSecondary }}>
                  Setup Time
                </Text>
                <Text variant="body2" style={{ fontWeight: '600' }}>
                  {option.setupTime}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  variant="caption"
                  style={{ color: colors.$textSecondary }}>
                  New Accounts
                </Text>
                <Text variant="body2" style={{ fontWeight: '600' }}>
                  {option.newAccountRequirement}
                </Text>
              </View>
            </View>

            {/* Benefits */}
            <View style={{ marginBottom: 12 }}>
              <Text
                variant="subtitle2"
                style={{ marginBottom: 8, color: colors.$textSuccess }}>
                ✓ Benefits
              </Text>
              {option.benefits.map((benefit, index) => (
                <Text
                  key={index}
                  variant="body2"
                  style={{
                    marginBottom: 4,
                    marginLeft: 16,
                    color: colors.$textSecondary
                  }}>
                  • {benefit}
                </Text>
              ))}
            </View>

            {/* Warnings */}
            {option.warnings.length > 0 && (
              <View>
                <Text
                  variant="subtitle2"
                  style={{ marginBottom: 8, color: colors.$textSecondary }}>
                  ⚠️ Considerations
                </Text>
                {option.warnings.map((warning, index) => (
                  <Text
                    key={index}
                    variant="body2"
                    style={{
                      marginBottom: 4,
                      marginLeft: 16,
                      color: colors.$textSecondary
                    }}>
                    • {warning}
                  </Text>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Action buttons */}
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          paddingTop: 24,
          borderTopWidth: 1,
          borderTopColor: colors.$borderPrimary
        }}>
        {onCancel && (
          <Button
            type="secondary"
            size="large"
            style={{ flex: 1 }}
            onPress={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="primary"
          size="large"
          style={{ flex: 1 }}
          disabled={!selectedType}
          onPress={handleContinue}>
          Continue
        </Button>
      </View>
    </View>
  )
}
