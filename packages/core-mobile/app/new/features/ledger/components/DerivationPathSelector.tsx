import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Text, useTheme, Icons } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { LedgerDerivationPathType } from 'services/ledger/types'

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
}

const derivationPathOptions: DerivationPathOption[] = [
  {
    type: LedgerDerivationPathType.BIP44,
    title: 'BIP44',
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
  onSelect
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
      </View>
    )
  }, [selectedType, onSelect])

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
      title="First, choose your setup Method"
      subtitle="Select how you would like to set up your Ledger wallet. Both options are secure"
      isModal
      contentContainerStyle={{
        padding: 16,
        gap: 16,
        paddingBottom: 100
      }}>
      <View style={{ marginTop: 16 }} />

      {derivationPathOptions.map(option => (
        <OptionCard
          key={option.type}
          option={option}
          onPress={() => onSelect(option.type)}
        />
      ))}
    </ScrollScreen>
  )
}
