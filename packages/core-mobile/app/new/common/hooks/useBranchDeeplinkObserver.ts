// import { useEffect } from 'react'
// import branch, { BranchParams } from 'react-native-branch'
// import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
// import { DeepLink, DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
// import { useSelector } from 'react-redux'
// import { selectDistinctID } from 'store/posthog'
// import Logger from 'utils/Logger'

// function handleBranchDeeplink(
//   setPendingDeepLink: (deepLink: DeepLink) => void,
//   params?: BranchParams | undefined
// ): void {
//   if (params?.$deeplink_path) {
//     setPendingDeepLink({
//       url: params.$deeplink_path as string,
//       origin: DeepLinkOrigin.ORIGIN_BRANCH
//     })
//   }
// }

// export function useBranchDeeplinkObserver(): void {
//   const { setPendingDeepLink } = useDeeplink()
//   const distinctID = useSelector(selectDistinctID)

//   useEffect(() => {
//     branch.setRequestMetadata('$posthog_distinct_id', distinctID)

//     branch
//       .getLatestReferringParams()
//       .then((params?: BranchParams) =>
//         handleBranchDeeplink(setPendingDeepLink, params)
//       )
//       .catch(Logger.error)

//     const unsubscribe = branch.subscribe(({ params }) =>
//       handleBranchDeeplink(setPendingDeepLink, params)
//     )

//     return () => {
//       unsubscribe()
//     }
//   }, [distinctID, setPendingDeepLink])
// }
