import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useMemo } from 'react'
import { View, GroupList } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { Space } from 'common/components/Space'
import { useSearchServiceProviders } from '../hooks/useSearchServiceProviders'
import { useOnRampServiceProvider } from '../store'
import { ServiceProviderCategories, ServiceProviderNames } from '../consts'
import { ServiceProviderIcon } from '../components/ServiceProviderIcon'

export const SelectServiceProviderScreen = (): React.JSX.Element => {
  const { back, canGoBack, dismissAll } = useRouter()
  const { data: serviceProviders } = useSearchServiceProviders({
    categories: [ServiceProviderCategories.CRYPTO_ONRAMP]
  })
  const [_, setOnRampServiceProvider] = useOnRampServiceProvider()

  const dismiss = useCallback(() => {
    dismissAll() // dismiss to top of the selectPaymentMethod stack
    canGoBack() && back() // dismiss initial selectPaymentMethod screen
  }, [back, canGoBack, dismissAll])

  const data = useMemo(() => {
    if (!serviceProviders) return []

    return serviceProviders.map(serviceProvider => {
      return {
        title: ServiceProviderNames[serviceProvider.serviceProvider],
        onPress: () => {
          setOnRampServiceProvider(serviceProvider.serviceProvider)
          dismiss()
        },
        accessory: <></>,
        leftIcon: (
          <View
            style={{
              borderRadius: 100,
              overflow: 'hidden'
            }}>
            <ServiceProviderIcon
              serviceProvider={serviceProvider.serviceProvider}
            />
          </View>
        )
      }
    })
  }, [dismiss, serviceProviders, setOnRampServiceProvider])

  return (
    <ScrollScreen
      isModal
      title="Change provider"
      subtitle="External providers are used to process fiat-to-crypto purchases. Rates vary between providers"
      contentContainerStyle={{
        padding: 16
      }}>
      <View sx={{ flex: 1 }}>
        <Space y={21} />
        <GroupList data={data} subtitleVariant="body1" />
      </View>
    </ScrollScreen>
  )
}
