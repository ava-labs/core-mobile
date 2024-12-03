import React, { useState } from 'react'
import { ScrollView, Text, View } from '../Primitives'
import { Button, useTheme } from '../..'
import { PageControl } from './PageControl'

export default {
  title: 'PageControl'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  const NUMBER_OF_PAGES = [3, 5, 20]

  return (
    <ScrollView
      style={{
        width: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}
      contentContainerStyle={{ padding: 16 }}>
      <View style={{ marginTop: 32, gap: 100 }}>
        {NUMBER_OF_PAGES.map((numberOfPage, index) => (
          <View key={index}>
            <PageControlStory numberOfPage={numberOfPage} />
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const PageControlStory = ({
  numberOfPage
}: {
  numberOfPage: number
}): JSX.Element => {
  const [currentPage, setCurrentPage] = useState(0)

  const handlePressPrevious = (): void => {
    setCurrentPage(prev => Math.max(prev - 1, 0))
  }

  const handlePressNext = (): void => {
    setCurrentPage(prev => Math.min(prev + 1, numberOfPage - 1))
  }

  return (
    <>
      <Text sx={{ alignSelf: 'center' }}>Page Size: {numberOfPage}</Text>
      <PageControl
        style={{
          marginTop: 20,
          marginBottom: 20,
          alignSelf: 'center'
        }}
        numberOfPage={numberOfPage}
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
    </>
  )
}
