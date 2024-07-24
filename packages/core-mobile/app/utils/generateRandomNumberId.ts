import Crypto from 'react-native-quick-crypto'

// Generates a random ID as a 64-bit unsigned integer
export function generateRandomNumberId(): number {
  // create a typed array to store the random values
  const array = new Uint32Array(2)

  // generate random values and fill the array
  Crypto.getRandomValues(array)

  // convert the array to a single number
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return array[0]! * Math.pow(2, 16) + array[1]!
}
