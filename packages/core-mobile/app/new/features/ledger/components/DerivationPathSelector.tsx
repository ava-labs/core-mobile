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
  onCancel?: () => void
}

interface ListItemProps {
  text: string
  type: 'benefit' | 'consideration'
  isFirst?: boolean
}

const ListItem: React.FC<ListItemProps> = ({ text, type, isFirst = false }) => {
  const {
    theme: { colors }
  } = useTheme()

  const iconProps =
    type === 'benefit'
      ? {
          Icon: Icons.Custom.CheckSmall,
          color: colors.$textSuccess
        }
      : {
          Icon: Icons.Custom.RedExclamation,
          color: colors.$textDanger,
          width: 16,
          height: 12
        }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: isFirst ? 4 : 0
      }}>
      <iconProps.Icon
        color={iconProps.color}
        {...(iconProps.width && {
          width: iconProps.width,
          height: iconProps.height
        })}
      />
      <Text
        variant="subtitle2"
        style={{
          color: colors.$textPrimary,
          lineHeight: 18,
          marginLeft: type === 'consideration' ? 4 : 0
        }}>
        {text}
      </Text>
    </View>
  )
}

interface OptionCardProps {
  option: DerivationPathOption
  onPress?: () => void
}

const OptionCard: React.FC<OptionCardProps> = ({ option, onPress }) => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: colors.$surfaceSecondary
      }}>
      <View
        style={{
          padding: 16,
          paddingBottom: 12,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16
          }}>
          <Icons.Custom.Ledger
            color={colors.$textPrimary}
            width={24}
            height={24}
          />
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
            <Text
              variant="subtitle1"
              style={{
                color: colors.$textPrimary,
                fontWeight: '500',
                fontSize: 16,
                lineHeight: 16
              }}>
              {option.title}
            </Text>
            <Text
              variant="caption"
              style={{
                color: colors.$textSecondary,
                fontSize: 12,
                lineHeight: 15
              }}>
              {option.subtitle}
            </Text>
          </View>
        </View>
        <Icons.Navigation.ChevronRight color={colors.$textSecondary} />
      </View>

      {/* Divider that spans from text start to card end */}
      <View
        style={{
          height: 1,
          backgroundColor: colors.$borderPrimary,
          width: '85%',
          alignSelf: 'flex-end'
        }}
      />

      <View style={{ paddingTop: 12, paddingStart: '15%' }}>
        <Text
          variant="caption"
          style={{
            color: colors.$textSecondary,
            fontSize: 12,
            lineHeight: 15
          }}>
          Benefits
        </Text>
        {option.benefits.map((benefit, index) => (
          <ListItem
            key={index}
            text={benefit}
            type="benefit"
            isFirst={index === 0}
          />
        ))}
      </View>

      {option.warnings.length > 0 && (
        <View
          style={{ paddingTop: 12, paddingStart: '15%', paddingBottom: 12 }}>
          <Text
            variant="caption"
            style={{
              color: colors.$textSecondary,
              fontSize: 12,
              lineHeight: 15
            }}>
            Considerations
          </Text>
          {option.warnings.map((warning, index) => (
            <ListItem
              key={index}
              text={warning}
              type="consideration"
              isFirst={index === 0}
            />
          ))}
        </View>
      )}
    </TouchableOpacity>
  )
}

const derivationPathOptions: DerivationPathOption[] = [
  {
    type: LedgerDerivationPathType.BIP44,
    title: 'BIP44',
    subtitle: 'Recommended for most users',
    benefits: [
      'Faster setup, about 15 seconds',
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
  return (
    <ScrollScreen
      title="First, choose your setup method"
      subtitle="Select how you would like to set up your Ledger wallet. Both options are secure"
      isModal
      contentContainerStyle={{
        padding: 16,
        gap: 16,
        paddingBottom: 100
      }}>
      <View style={{ marginTop: 8 }} />

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
