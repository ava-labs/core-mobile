import React, { FC, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import LottieView from 'lottie-react-native'
import SpinnerSource from 'assets/lotties/spinner.json'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Props {
  size: number
  color?: string
}

const Spinner: FC<Props> = ({ size = 40, color }) => {
  const theme = useApplicationContext().theme
  const lottieRef = React.useRef<LottieView | null>(null)

  const spinnerColor = color ?? theme.colorPrimary1

  // temp workaround for autoplay issue
  // https://github.com/lottie-react-native/lottie-react-native/issues/832
  useEffect(() => {
    setTimeout(() => {
      lottieRef.current?.play()
    }, 0)
  }, [])

  return (
    <View style={styles.container}>
      <LottieView
        ref={lottieRef}
        autoPlay={true}
        loop={true}
        source={SpinnerSource}
        style={{
          width: size,
          height: size
        }}
        colorFilters={[
          {
            keypath: 'spinner Outlines',
            color: spinnerColor
          }
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  }
})

export default Spinner
