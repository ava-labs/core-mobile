import React from "react"
import {Appearance} from "react-native"
import {COLORS, COLORS_NIGHT} from "./Constants"
import {TabBar} from "react-native-tab-view"


export default (props: any) => {
  const isDarkMode = Appearance.getColorScheme() === 'dark'
  const THEME = isDarkMode ? COLORS_NIGHT : COLORS
  return <TabBar
    {...props}
    indicatorStyle={{backgroundColor: THEME.tabBarIndicator}}
    style={{backgroundColor: THEME.transparent}}
    labelStyle={{fontWeight: "bold"}}
    activeColor={THEME.tabBarText}
    inactiveColor={THEME.primaryColorLight}
  />
}
