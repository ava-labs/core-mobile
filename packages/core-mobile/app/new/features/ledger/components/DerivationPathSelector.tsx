import React, { useState, useCallback } from 'react'
import { View } from 'react-native'
import { Text, Button, useTheme, GroupList, Icons } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
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

  const selectedOption = derivationPathOptions.find(
    option => option.type === selectedType
  )

  const renderFooter = useCallback(() => {
    return (
      <View style={{ padding: 16, gap: 12 }}>
        <Button
          type="primary"
          size="large"
          disabled={!selectedType}
          onPress={() => selectedType && onSelect(selectedType)}>
          Continue
        </Button>

        {onCancel && (
          <Button type="tertiary" size="large" onPress={onCancel}>
            Cancel
          </Button>
        )}
      </View>
    )
  }, [selectedType, onSelect, onCancel])

  const groupListData = derivationPathOptions.map(option => ({
    title: option.title,
    subtitle: (
      <Text variant="caption" sx={{ fontSize: 12, paddingTop: 4 }}>
        {option.subtitle}
      </Text>
    ),
    leftIcon: (
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: option.recommended
            ? colors.$textSuccess
            : colors.$surfaceSecondary,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <Icons.Device.Encrypted
          color={option.recommended ? colors.$white : colors.$textPrimary}
          width={20}
          height={20}
        />
      </View>
    ),
    accessory:
      selectedType === option.type ? (
        <Icons.Action.CheckCircle
          color={colors.$textSuccess}
          width={24}
          height={24}
        />
      ) : (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: colors.$borderPrimary
          }}
        />
      ),
    onPress: () => setSelectedType(option.type)
  }))

  return (
    <ScrollScreen
      title="Choose Setup Method"
      subtitle="Select how you'd like to set up your Ledger wallet. Both options are secure."
      isModal
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View style={{ marginTop: 24 }}>
        <GroupList itemHeight={70} data={groupListData} />
      </View>

      {selectedOption && (
        <View style={{ marginTop: 32 }}>
          {/* Recommendation badge */}
          {selectedOption.recommended && (
            <View
              style={{
                backgroundColor: colors.$textSuccess,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                alignSelf: 'flex-start',
                marginBottom: 16
              }}>
              <Text
                variant="caption"
                style={{ color: colors.$white, fontWeight: '600' }}>
                RECOMMENDED
              </Text>
            </View>
          )}

          {/* Quick stats */}
          <View
            style={{
              backgroundColor: colors.$surfaceSecondary,
              borderRadius: 12,
              padding: 16,
              marginBottom: 24
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between'
              }}>
              <View style={{ flex: 1 }}>
                <Text
                  variant="caption"
                  style={{ color: colors.$textSecondary }}>
                  Setup Time
                </Text>
                <Text
                  variant="body1"
                  style={{ fontWeight: '600', marginTop: 4 }}>
                  {selectedOption.setupTime}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  variant="caption"
                  style={{ color: colors.$textSecondary }}>
                  New Accounts
                </Text>
                <Text
                  variant="body1"
                  style={{ fontWeight: '600', marginTop: 4 }}>
                  {selectedOption.newAccountRequirement}
                </Text>
              </View>
            </View>
          </View>

          {/* Benefits */}
          <View style={{ marginBottom: 24 }}>
            <Text
              variant="heading6"
              style={{ marginBottom: 12, color: colors.$textSuccess }}>
              ✓ Benefits
            </Text>
            {selectedOption.benefits.map((benefit, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: 8
                }}>
                <Text
                  variant="body2"
                  style={{ color: colors.$textSuccess, marginRight: 8 }}>
                  •
                </Text>
                <Text
                  variant="body2"
                  style={{ color: colors.$textSecondary, flex: 1 }}>
                  {benefit}
                </Text>
              </View>
            ))}
          </View>

          {/* Considerations */}
          {selectedOption.warnings.length > 0 && (
            <View>
              <Text
                variant="heading6"
                style={{ marginBottom: 12, color: colors.$textSecondary }}>
                ⚠️ Considerations
              </Text>
              {selectedOption.warnings.map((warning, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: 8
                  }}>
                  <Text
                    variant="body2"
                    style={{ color: colors.$textSecondary, marginRight: 8 }}>
                    •
                  </Text>
                  <Text
                    variant="body2"
                    style={{ color: colors.$textSecondary, flex: 1 }}>
                    {warning}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollScreen>
  )
}
