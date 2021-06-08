import React, {Component} from "react"
import {ActivityIndicator, Appearance, StyleSheet, Text, View} from "react-native"
import {Colors} from "react-native/Libraries/NewAppScreen"
import CommonViewModel from "../CommonViewModel"

type LoaderProps = {
  message: string,
}
type LoaderState = {
  isDarkMode: boolean,
  backgroundStyle: any,
  message: string,
}

class Loader extends Component<LoaderProps, LoaderState> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

  constructor(props: LoaderProps | Readonly<LoaderProps>) {
    super(props)
    this.state = {
      isDarkMode: false,
      backgroundStyle: {},
      message: this.props.message
    }
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => {
      this.setState({isDarkMode: value})
    })
    this.commonViewModel.backgroundStyle.subscribe(value => {
      this.setState({backgroundStyle: value})
    })
  }

  componentWillUnmount(): void {
  }

  render(): Element {
    return (
      <View style={[styles.container, this.state.backgroundStyle]}>
        <ActivityIndicator size="large" color={this.state.isDarkMode ? Colors.white : Colors.black}/>

        <Text
          style={[
            styles.text,
            {color: this.state.isDarkMode ? Colors.white : Colors.black},
          ]}>
          {this.state.message}
        </Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center"
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 26
  },
})

export default Loader
