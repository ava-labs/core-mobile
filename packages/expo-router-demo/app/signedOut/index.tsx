import { Link } from "expo-router"
import { View } from "react-native"

const SignUpScreen = (): JSX.Element => {
  return <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}><Link href="/signedIn/portfolio/">Sign up</Link></View>
}

export default SignUpScreen
