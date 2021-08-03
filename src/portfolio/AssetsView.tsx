import React, {useEffect, useState} from "react"
import {FlatList, Modal, StyleSheet, View} from "react-native"
import Header from "../mainView/Header"
import TextTitle from "../common/TextTitle"
import {SceneMap, TabView} from "react-native-tab-view"
import AssetsViewModel, {TokenItem} from "./AssetsViewModel"
import AssetsItem from "./AssetsItem"
import {BehaviorSubject} from "rxjs"
import TabBarAva from "../common/TabBarAva"
import ButtonAva from "../common/ButtonAva"
import AssetsAddToken from "./AssetsAddToken"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"

type Props = {
  wallet: BehaviorSubject<MnemonicWallet>,
}

export default function AssetsView(props: Props | Readonly<Props>) {
  const [viewModel] = useState(new AssetsViewModel(props.wallet))
  const [addTokenVisible, setAddTokenVisible] = useState(false)
  const [index, setIndex] = useState(0)
  const [tokenItems, setTokenItems] = useState([] as TokenItem[])

  useEffect(() => {
    viewModel.tokenItems.subscribe(value => setTokenItems(value))
  }, [])

  const renderItem = (item: TokenItem) => (
    <AssetsItem title={item.title} balance={item.balance}/>
  )

  const tokensRoute = () => (
    <FlatList data={tokenItems}
              renderItem={info => renderItem(info.item)}
              keyExtractor={item => item.id}/>
  )

  const collectiblesRoute = () => (
    <TextTitle text={"Collectibles"}/>
  )

  const renderScene = SceneMap({
    Tokens: tokensRoute,
    Collectibles: collectiblesRoute,
  })

  const routes = [
    {key: 'Tokens', title: 'Tokens'},
    {key: 'Collectibles', title: 'Collectibles'},
  ]

  return (
    <View style={styles.container}>
      <Header/>
      <TabView
        navigationState={{
          index: index,
          routes: routes
        }}
        renderScene={renderScene}
        renderTabBar={TabBarAva}
        onIndexChange={index => setIndex(index)}
      />
      <ButtonAva text={"Add token"} onPress={() => setAddTokenVisible(true)}/>

      <Modal
        animationType="slide"
        transparent={true}
        visible={addTokenVisible}
        onRequestClose={() => setAddTokenVisible(false)}>
        <AssetsAddToken
          wallet={viewModel.wallet}
          onClose={() => {
            setAddTokenVisible(false)
          }}/>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
  },
})

