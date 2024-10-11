import { Link } from 'expo-router'
import { Text, View } from 'react-native'

export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Link href="/signedIn/portfolio/">Sign In</Link>
      <Link href="/signedOut/">Signed Out</Link>
    </View>
  )
}
