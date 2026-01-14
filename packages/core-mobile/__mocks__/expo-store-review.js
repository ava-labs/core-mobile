const StoreReview = {
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  requestReview: jest.fn(() => Promise.resolve())
}

export default StoreReview
export const isAvailableAsync = StoreReview.isAvailableAsync
export const requestReview = StoreReview.requestReview
