import React from 'react'
import { BottomTabs } from 'common/components/BottomTabs'

export default function TabLayout(): JSX.Element {
  return (
    <BottomTabs
      tabBarStyle={{
        backgroundColor: 'white'
      }}>
      <BottomTabs.Screen
        name="portfolio"
        options={{
          title: 'Home',
          tabBarIcon: () => ({
            uri: 'https://www.svgrepo.com/show/533813/hat-chef.svg'
          })
        }}
      />
      <BottomTabs.Screen
        name="track"
        options={{
          title: 'Track',
          tabBarIcon: () => ({
            uri: 'https://www.svgrepo.com/show/533824/water-container.svg'
          })
        }}
      />
      <BottomTabs.Screen
        name="stake"
        options={{
          title: 'Stake',
          tabBarIcon: () => ({
            uri: 'https://www.svgrepo.com/show/533826/shop.svg'
          })
        }}
      />
      <BottomTabs.Screen
        name="browser"
        options={{
          title: 'Browser',
          tabBarIcon: () => ({
            uri: 'https://www.svgrepo.com/show/533828/cheese.svg'
          })
        }}
      />
    </BottomTabs>
  )
  // return (
  //   <BottomTabs
  //     screenOptions={{
  //       headerShown: false,
  //       tabBarBackground,
  //       tabBarLabelStyle: {
  //         fontFamily: 'Inter-SemiBold'
  //       },
  //       tabBarStyle: {
  //         position: 'absolute'
  //       }
  //     }}>
  //     <BottomTabs.Screen
  //       name="portfolio"
  //       options={{
  //         title: 'Portfolio',
  //         tabBarIcon: PortfolioTabBarIcon
  //       }}
  //     />
  //     <BottomTabs.Screen
  //       name="track"
  //       options={{
  //         title: 'Track',
  //         tabBarIcon: TrackTabBarIcon
  //       }}
  //     />
  //     <BottomTabs.Screen
  //       name="stake"
  //       options={{
  //         title: 'Stake',
  //         tabBarIcon: StakeTabBarIcon
  //       }}
  //     />
  //     <BottomTabs.Screen
  //       name="browser"
  //       options={{
  //         title: 'Browser',
  //         tabBarIcon: BrowserTabBarIcon
  //       }}
  //     />
  //   </BottomTabs>
  // )
}
