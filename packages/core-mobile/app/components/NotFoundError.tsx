import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { ErrorSVG } from './TopLevelErrorFallback'

// same as TopLevelErrorFallback but with a different button
export const NotFoundError = ({
  title,
  description
}: {
  title: string
  description: string
}): React.ReactNode => {
  const navigation = useNavigation()

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: '#000000',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }
      ]}>
      <View style={{ marginBottom: 30 }}>
        <ErrorSVG />
      </View>
      {/* Heading3 */}
      <Text
        style={{
          color: '#F8F8FB',
          fontFamily: 'Inter-SemiBold',
          fontSize: 16,
          lineHeight: 24
        }}>
        {title}
      </Text>
      {/* Body2 */}
      <Text
        style={{
          color: '#F8F8FB',
          fontFamily: 'Inter-Regular',
          fontSize: 14,
          lineHeight: 17
        }}>
        {description}
      </Text>
      <Pressable
        onPress={() => {
          navigation.goBack()
        }}
        style={{
          alignSelf: 'auto',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 25,
          bottom: 75,
          height: 48,
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingVertical: 12,
          position: 'absolute',
          width: '100%'
        }}>
        <Text
          style={{
            color: '#1A1A1C',
            fontFamily: 'Inter-SemiBold',
            fontSize: 18,
            lineHeight: 22
          }}>
          Go Back
        </Text>
      </Pressable>
    </View>
  )
}
