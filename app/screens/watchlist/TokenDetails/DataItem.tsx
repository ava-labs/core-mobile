import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'

export const DataItem = ({
  title,
  value,
  testID
}: {
  title: string
  value: string | React.ReactNode
  testID?: string
}) => {
  const { theme } = useApplicationContext()

  return (
    <View style={styles.container}>
      <AvaText.Body2 textStyle={{ color: theme.colorText3 }} testID={testID}>
        {title}
      </AvaText.Body2>
      {typeof value === 'string' ? (
        <AvaText.Heading3>{value}</AvaText.Heading3>
      ) : (
        value
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 }
})
