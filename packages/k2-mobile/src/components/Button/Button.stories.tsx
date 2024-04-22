import React from 'react'
import { StyleSheet } from 'react-native'
import { withCenterView } from '../../../storybook/decorators/withCenterView'
import { ScrollView, View } from '../Primitives'
import Link from '../../utils/Link'
import { Button, ButtonSize, ButtonType } from './Button'

export default {
  title: 'Button',
  decorators: [withCenterView]
}

export const All = (): JSX.Element => {
  const types: ButtonType[] = [
    'primary',
    'primaryDanger',
    'secondary',
    'tertiary',
    'tertiaryDanger'
  ]
  const sizes: ButtonSize[] = ['xlarge', 'large', 'medium', 'small']
  const statuses = ['enabled', 'disabled']

  const renderRow = (type: ButtonType, status: string): JSX.Element => {
    return (
      <View style={styles.row}>
        {sizes.map((size, index) => (
          <Button
            type={type}
            size={size}
            disabled={status === 'disabled'}
            key={index}
            style={{ marginRight: index !== sizes.length - 1 ? 10 : 0 }}>
            Button
          </Button>
        ))}
      </View>
    )
  }

  const renderGroup = (type: ButtonType): JSX.Element => {
    return (
      <>
        {statuses.map((status, index) => (
          <View
            key={index}
            style={{ marginBottom: index !== statuses.length - 1 ? 10 : 0 }}>
            {renderRow(type, status)}
          </View>
        ))}
      </>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Link
        title="Figma Source"
        url={FIGMA_LINK}
        style={{ marginBottom: 20 }}
      />
      {types.map((type, index) => (
        <View
          key={index}
          style={{ marginBottom: index !== types.length - 1 ? 40 : 0 }}>
          {renderGroup(type)}
        </View>
      ))}
      <View style={{ height: 60 }} />
      {types.map((type, index) => (
        <Button
          type={type}
          size="large"
          leftIcon="check"
          rightIcon="expandMore"
          style={{
            marginBottom: index !== types.length - 1 ? 16 : 0,
            width: 300
          }}
          key={index}>
          Button
        </Button>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row'
  }
})

const FIGMA_LINK =
  'https://www.figma.com/file/TAXtaoLGSNNt8nAqqcYH2H/K2-Component-Library?type=design&node-id=1869-36606&mode=design&t=9WAiwS0ehBNLg93L-11'
