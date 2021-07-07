import React, {Component} from "react"
import {ActivityIndicator, Appearance, SafeAreaView, StyleSheet, View} from "react-native"
import {Colors} from "react-native/Libraries/NewAppScreen"
import CommonViewModel from "../CommonViewModel"
import TextTitle from "./TextTitle"
import Header from "../mainView/Header"

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
      <SafeAreaView style={this.state.backgroundStyle}>
        <View style={this.state.backgroundStyle}>
          <View style={styles.headerContainer}>
            <Header/>
          </View>
          <View style={styles.container}>
            <ActivityIndicator size="large" color={this.state.isDarkMode ? Colors.white : Colors.black}/>
            <TextTitle text={this.props.message} textAlign={"center"}/>
          </View>
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center"
  },
  headerContainer: {
    width: "100%",
    top: 0,
  },
})

export default Loader
