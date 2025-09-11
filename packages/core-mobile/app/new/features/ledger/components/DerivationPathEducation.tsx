import React, { useState } from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import { Text, Button, useTheme } from '@avalabs/k2-alpine'
import { LedgerDerivationPathType } from 'services/wallet/LedgerWallet'

interface EducationSection {
  title: string
  content: string
  icon: string
}

interface DerivationPathEducationProps {
  onClose: () => void
  onSelectRecommended?: () => void
}

const educationSections: EducationSection[] = [
  {
    title: 'What are derivation paths?',
    content: 'Derivation paths are like addresses that tell your Ledger device which keys to generate. Different paths offer different security and convenience tradeoffs.',
    icon: '🔑'
  },
  {
    title: 'BIP44 Standard',
    content: 'BIP44 is the most common approach used by most wallets. It stores "extended keys" that allow creating new accounts without connecting your device each time.',
    icon: '⚡'
  },
  {
    title: 'Ledger Live Approach',
    content: 'Ledger Live uses individual keys for maximum security. Each account requires explicit device confirmation, but no extended keys are stored locally.',
    icon: '🔒'
  },
  {
    title: 'Which should I choose?',
    content: 'For most users, BIP44 offers the best balance of security and convenience. Choose Ledger Live only if you prioritize maximum security over convenience.',
    icon: '🤔'
  }
]

const comparisonData = [
  {
    feature: 'Setup Time',
    bip44: '~15 seconds',
    ledgerLive: '~45 seconds',
    winner: 'bip44'
  },
  {
    feature: 'New Account Creation',
    bip44: 'Instant (no device)',
    ledgerLive: 'Requires device',
    winner: 'bip44'
  },
  {
    feature: 'Security Level',
    bip44: 'High (standard)',
    ledgerLive: 'Maximum',
    winner: 'ledgerLive'
  },
  {
    feature: 'Compatibility',
    bip44: 'Universal',
    ledgerLive: 'Ledger ecosystem',
    winner: 'bip44'
  },
  {
    feature: 'User Experience',
    bip44: 'Smooth',
    ledgerLive: 'More confirmations',
    winner: 'bip44'
  }
]

export const DerivationPathEducation: React.FC<DerivationPathEducationProps> = ({
  onClose,
  onSelectRecommended
}) => {
  const { theme: { colors } } = useTheme()
  const [activeSection, setActiveSection] = useState<number | null>(null)

  const toggleSection = (index: number) => {
    setActiveSection(activeSection === index ? null : index)
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.$surfacePrimary }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: colors.$borderPrimary
      }}>
        <Text variant="heading4">
          Understanding Setup Methods
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Text variant="body1" style={{ color: colors.$textSecondary }}>
            ✕
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Education sections */}
        <View style={{ padding: 24 }}>
          {educationSections.map((section, index) => (
            <TouchableOpacity
              key={index}
              style={{
                borderWidth: 1,
                borderColor: colors.$borderPrimary,
                borderRadius: 12,
                marginBottom: 12,
                overflow: 'hidden'
              }}
              onPress={() => toggleSection(index)}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: activeSection === index 
                  ? colors.$surfaceSecondary 
                  : colors.$surfacePrimary
              }}>
                <Text style={{ fontSize: 24, marginRight: 12 }}>
                  {section.icon}
                </Text>
                <Text variant="subtitle1" style={{ flex: 1 }}>
                  {section.title}
                </Text>
                <Text style={{ 
                  fontSize: 16, 
                  color: colors.$textSecondary,
                  transform: [{ rotate: activeSection === index ? '180deg' : '0deg' }]
                }}>
                  ▼
                </Text>
              </View>
              
              {activeSection === index && (
                <View style={{
                  padding: 16,
                  paddingTop: 0,
                  backgroundColor: colors.$surfaceSecondary
                }}>
                  <Text variant="body2" style={{ 
                    color: colors.$textSecondary,
                    lineHeight: 20
                  }}>
                    {section.content}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Comparison table */}
        <View style={{ padding: 24, paddingTop: 0 }}>
          <Text variant="heading6" style={{ marginBottom: 16 }}>
            Side-by-Side Comparison
          </Text>
          
          <View style={{
            borderWidth: 1,
            borderColor: colors.$borderPrimary,
            borderRadius: 12,
            overflow: 'hidden'
          }}>
            {/* Header row */}
            <View style={{
              flexDirection: 'row',
              backgroundColor: colors.$surfaceSecondary,
              paddingVertical: 12,
              paddingHorizontal: 16
            }}>
              <Text variant="subtitle2" style={{ flex: 2 }}>Feature</Text>
              <Text variant="subtitle2" style={{ flex: 2, textAlign: 'center' }}>BIP44</Text>
              <Text variant="subtitle2" style={{ flex: 2, textAlign: 'center' }}>Ledger Live</Text>
            </View>

            {/* Data rows */}
            {comparisonData.map((row, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderTopWidth: 1,
                  borderTopColor: colors.$borderPrimary
                }}
              >
                <Text variant="body2" style={{ flex: 2, color: colors.$textSecondary }}>
                  {row.feature}
                </Text>
                <Text variant="body2" style={{ 
                  flex: 2, 
                  textAlign: 'center',
                  color: row.winner === 'bip44' ? colors.$textSuccess : colors.$textSecondary,
                  fontWeight: row.winner === 'bip44' ? '600' : 'normal'
                }}>
                  {row.bip44}
                </Text>
                <Text variant="body2" style={{ 
                  flex: 2, 
                  textAlign: 'center',
                  color: row.winner === 'ledgerLive' ? colors.$textSuccess : colors.$textSecondary,
                  fontWeight: row.winner === 'ledgerLive' ? '600' : 'normal'
                }}>
                  {row.ledgerLive}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recommendation */}
        <View style={{
          margin: 24,
          padding: 20,
          backgroundColor: colors.$surfaceSecondary,
          borderRadius: 12,
          borderLeftWidth: 4,
          borderLeftColor: colors.$textSuccess
        }}>
          <Text variant="subtitle1" style={{ marginBottom: 8 }}>
            💡 Our Recommendation
          </Text>
          <Text variant="body2" style={{ 
            color: colors.$textSecondary,
            lineHeight: 20,
            marginBottom: 16
          }}>
            For most users, <Text style={{ fontWeight: '600' }}>BIP44</Text> provides the best 
            experience with excellent security. It's faster to set up, easier to manage, 
            and compatible with all wallets.
          </Text>
          <Text variant="body2" style={{ 
            color: colors.$textSecondary,
            lineHeight: 20
          }}>
            Choose <Text style={{ fontWeight: '600' }}>Ledger Live</Text> only if you're a 
            security expert who prioritizes maximum security over convenience.
          </Text>
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={{
        flexDirection: 'row',
        gap: 12,
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: colors.$borderPrimary
      }}>
        <Button
          type="secondary"
          size="large"
          style={{ flex: 1 }}
          onPress={onClose}
        >
          Back to Selection
        </Button>
        {onSelectRecommended && (
          <Button
            type="primary"
            size="large"
            style={{ flex: 1 }}
            onPress={onSelectRecommended}
          >
            Use BIP44 (Recommended)
          </Button>
        )}
      </View>
    </View>
  )
}
