import React, {Component} from "react"
import {ActivityIndicator, Appearance, StyleSheet, View} from "react-native"
import {Colors} from "react-native/Libraries/NewAppScreen"
import CommonViewModel from "../CommonViewModel"
import TextTitle from "./TextTitle"

type LoaderProps = {
  message: string,
}
type LoaderState = {
  isDarkMode: boolean,
  backgroundStyle: any,
}

class Loader extends Component<LoaderProps, LoaderState> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

  constructor(props: LoaderProps | Readonly<LoaderProps>) {
    super(props)
    this.state = {
      isDarkMode: false,
      backgroundStyle: {},
    }
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))
  }

  componentWillUnmount(): void {
  }

  render(): Element {
    return (
      <View style={[styles.container, this.state.backgroundStyle]}>
        <ActivityIndicator size="large" color={this.state.isDarkMode ? Colors.white : Colors.black}/>
        <TextTitle text={this.props.message} textAlign={"center"}/>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center"
  },
})

export default Loader
