import React from "react"
import {Image, StyleSheet} from "react-native"

type Props = {
  filled?: boolean,
}

const getIcon = (isFilled: boolean) => {
  return isFilled ? require("../assets/icons/dot_filled.png") : require("../assets/icons/dot.png")
}

export default function Dot(props: Props | Readonly<Props>) {
  const icon = getIcon(props.filled || false)

  return (
    <Image source={icon} width={20} height={20} style={styles.image}/>
  )
}

const styles = StyleSheet.create({
  image: {
    width: 20,
    height: 20,
  }
})

