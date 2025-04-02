import React from 'react'
import { Link } from 'expo-router'
import { StyleSheet } from 'react-native'

import { View, Text } from '@avalabs/k2-alpine'

export default function NotFoundScreen(): JSX.Element {
  return (
    <>
      <View style={styles.container}>
        <Text variant="heading1">This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text variant="buttonSmall">Go to home screen!!</Text>
        </Link>
        <Link href="_sitemap" style={styles.link}>
          <Text variant="buttonSmall">Go to sitemap</Text>
        </Link>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  link: {
    marginTop: 15,
    paddingVertical: 15
  }
})
