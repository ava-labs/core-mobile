import React, {Component} from 'react';
import {Appearance, ColorSchemeName, Image, StyleSheet, View} from 'react-native';
import ImgButtonAva from "../common/ImgButtonAva"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "../common/Constants"

type Props = {
  onBack?: () => void
  hideBack?: boolean
}
type State = {
  isDarkMode: boolean,
  iconSufix: ColorSchemeName,
}

class Header extends Component<Props, State> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      iconSufix: undefined,
    }
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.iconSufix.subscribe(value => this.setState({iconSufix: value}))
  }

  private onBackPress = () => {
    this.props.onBack?.()
  }

  render() {
    const THEME = this.state.isDarkMode ? COLORS_NIGHT : COLORS

    const icon = this.state.isDarkMode ? require("../assets/icons/arrow_back_dark.png") : require("../assets/icons/arrow_back_light.png")
    const backBtn = this.props.hideBack === true ? undefined : <ImgButtonAva src={icon} onPress={this.onBackPress}/>

    return (
      <View style={styles.horizontalLayout}>
        <View style={styles.padded}>
          <Image
            accessibilityRole="image"
            source={require('../assets/AvaLogo.png')}
            style={styles.logo}/>
        </View>
        {backBtn}
      </View>
    );
  }
}

const styles: any = StyleSheet.create({

  logo: {
    height: "100%",
    width: "100%",
    resizeMode: 'contain',
  },
  horizontalLayout: {
    flex: 0,
    height: 48,
  },
  padded: {
    position: "absolute",
    width: "100%",
    height: "100%",
    paddingTop: 8,
    paddingBottom: 8,
  },
});

export default Header;
