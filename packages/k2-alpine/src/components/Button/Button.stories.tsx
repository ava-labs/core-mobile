import React, { FC, PropsWithChildren, useState } from 'react'
import { Switch } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ScrollView, Text, View } from '../Primitives'
import Link from '../../utils/Link'
import { useTheme } from '../..'
import { Button, ButtonSize, ButtonType } from './Button'
import { FilterButton } from './FilterButton'

export default {
  title: 'Button'
}

export const All = (): JSX.Element => {
  const types: ButtonType[] = ['primary', 'secondary', 'tertiary']
  const sizes: ButtonSize[] = ['large', 'medium', 'small']
  const [isBlurTesting, setIsBlurTesting] = useState(false)
  const { theme } = useTheme()

  const renderRow = (type: ButtonType, disabled?: boolean): JSX.Element => {
    return (
      <View
        sx={{
          alignItems: 'flex-start',
          flexDirection: 'row'
        }}>
        {sizes.map((size, index) => (
          <Button
            type={type}
            size={size}
            key={index}
            disabled={disabled}
            style={{ marginRight: index !== sizes.length - 1 ? 10 : 0 }}>
            {disabled ? 'disabled' : type}
          </Button>
        ))}
      </View>
    )
  }

  const BackgroundComponent = isBlurTesting ? BackgroundForBlur : View

  return (
    <BackgroundComponent
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <ScrollView
        style={{ width: '100%', backgroundColor: 'transparent' }}
        contentContainerStyle={{ padding: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
          <Link title="Figma Source" url={FIGMA_LINK} />
          <View
            style={{
              gap: 8,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
            <Text>Blur Test</Text>
            <Switch value={isBlurTesting} onValueChange={setIsBlurTesting} />
          </View>
        </View>
        {types.map((type, index) => (
          <View
            key={index}
            style={{
              marginBottom: 16
            }}>
            {renderRow(type)}
          </View>
        ))}
        {renderRow('primary', true)}
        <View style={{ height: 60 }} />
        {types.map((type, index) => (
          <Button
            type={type}
            size="large"
            leftIcon="check"
            rightIcon="expandMore"
            style={{
              marginBottom: 16,
              width: 300
            }}
            key={index}>
            {type}
          </Button>
        ))}
        <Button
          type={'primary'}
          size="large"
          leftIcon="check"
          rightIcon="expandMore"
          disabled={true}
          style={{
            width: 300
          }}>
          disabled
        </Button>
        <View
          style={{
            marginTop: 20,
            flexDirection: 'row'
          }}>
          <FilterButton title={'Most tradable'} />
        </View>
        <View style={{ height: 160 }} />
      </ScrollView>
    </BackgroundComponent>
  )
}

const BackgroundForBlur: FC<PropsWithChildren> = ({ children }) => (
  <LinearGradient
    colors={[
      '#ff4500', // Deep orange
      '#ff7f00', // Lighter orange
      '#ffcc00', // Gold
      '#33cc33', // Green
      '#0099ff', // Blue
      '#663399', // Purple
      '#ff66cc' // Pink
    ]}
    locations={[0, 0.15, 0.35, 0.55, 0.7, 0.85, 1]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{
      width: '100%',
      flex: 1
    }}>
    {children}
  </LinearGradient>
)

const FIGMA_LINK =
  'https://www.figma.com/design/opZ4C1UGzcoGRjxE4ZIE3J/K2-Alpine?node-id=7-1465&m=dev'
