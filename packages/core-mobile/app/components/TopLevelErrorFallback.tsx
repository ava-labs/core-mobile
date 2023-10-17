import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import RNRestart from 'react-native-restart'
import Svg, { Path } from 'react-native-svg'

/**
 * !!! Not using `theme` because this component is rendered before it's available !!!
 */
export const TopLevelErrorFallback = () => (
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
      Something went wrong
    </Text>
    {/* Body2 */}
    <Text
      style={{
        color: '#F8F8FB',
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        lineHeight: 17
      }}>
      Tap the button below to reload the application.
    </Text>
    <Pressable
      onPress={() => RNRestart.Restart()}
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
        Reload
      </Text>
    </Pressable>
  </View>
)

const ErrorSVG = () => (
  <Svg width="60" height="60" viewBox="0 0 60 60" fill="none">
    <Path
      d="M30.5 15C32.15 15 33.5 16.35 33.5 18V30C33.5 31.65 32.15 33 30.5 33C28.85 33 27.5 31.65 27.5 30V18C27.5 16.35 28.85 15 30.5 15ZM30.47 0C13.91 0 0.5 13.44 0.5 30C0.5 46.56 13.91 60 30.47 60C47.06 60 60.5 46.56 60.5 30C60.5 13.44 47.06 0 30.47 0ZM30.5 54C17.24 54 6.5 43.26 6.5 30C6.5 16.74 17.24 6 30.5 6C43.76 6 54.5 16.74 54.5 30C54.5 43.26 43.76 54 30.5 54ZM33.5 45H27.5V39H33.5V45Z"
      fill="#F8F8FB"
    />
  </Svg>
)
