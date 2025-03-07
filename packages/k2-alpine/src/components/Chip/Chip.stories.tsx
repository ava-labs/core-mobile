import React from 'react'
import { ScrollView, View } from '../Primitives'
import Link from '../../utils/Link'
import { useTheme } from '../..'
import { Chip } from './Chip'

export default {
  title: 'Chip'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View
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
        </View>
        <Chip size={'large'}>sort</Chip>
        <View style={{ height: 20 }} />
        <Chip size={'large'} rightIcon={'expandMore'}>
          sort
        </Chip>
        <View style={{ height: 20 }} />
        <Chip size={'small'}>sort</Chip>
        <View style={{ height: 20 }} />
        <Chip
          size={'small'}
          rightIcon={'expandMore'}
          style={{ marginRight: 0 }}>
          sort
        </Chip>
      </ScrollView>
    </View>
  )
}

const FIGMA_LINK =
  'https://www.figma.com/design/opZ4C1UGzcoGRjxE4ZIE3J/K2-Alpine?node-id=232-156&t=X0Rz2DS57oWq0KKC-0'
