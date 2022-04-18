import React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Props {
  chain: string
  active?: boolean
  onChainSelected?: () => void
  size?: number
  textSize?: number
}

function BlockchainCircle({ chain, onChainSelected, size, textSize }: Props) {
  const context = useApplicationContext()

  return (
    <TouchableOpacity
      onPress={onChainSelected}
      style={[
        styles.circle,
        {
          backgroundColor: context.theme.colorBg3,
          width: size ?? 40,
          height: size ?? 40
        }
      ]}>
      <Text
        style={[
          {
            color: context.theme.alternateBackground,
            fontSize: textSize ?? 16
          }
        ]}>
        {chain.toUpperCase()}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: 2000,
    alignItems: 'center',
    justifyContent: 'center'
  }
})

export default BlockchainCircle
