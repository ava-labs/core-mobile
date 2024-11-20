import React, { useState } from 'react'
import { ScrollView, View } from '../Primitives'
import { Button, useTheme } from '../..'
import { PageControl } from './PageControl'

export default {
  title: 'PageControl'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  const NUMBER_OF_PAGE = 15

  const [currentPage, setCurrentPage] = useState(0)

  const handlePressPrevious = (): void => {
    setCurrentPage(prev => Math.max(prev - 1, 0))
  }

  const handlePressNext = (): void => {
    setCurrentPage(prev => Math.min(prev + 1, NUMBER_OF_PAGE - 1))
  }

  return (
    <ScrollView
      style={{
        width: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}
      contentContainerStyle={{ padding: 16 }}>
      <PageControl
        style={{
          marginTop: 100,
          marginBottom: 20,
          alignSelf: 'center'
        }}
        numberOfPage={NUMBER_OF_PAGE}
        currentPage={currentPage}
      />
      <View sx={{ flexDirection: 'row', gap: 12, alignSelf: 'center' }}>
        <Button type="primary" size="small" onPress={handlePressPrevious}>
          {'<'}
        </Button>
        <Button type="primary" size="small" onPress={handlePressNext}>
          {'>'}
        </Button>
      </View>
      <View style={{ height: 160 }} />
    </ScrollView>
  )
}
