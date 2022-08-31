type Config = {
  iterations: number
  memory: number
  parallelism: number
  hashLength: number
  mode: 'argon2id' | 'argon2d' | 'argon2i'
}

declare module 'react-native-argon2' {
  function argon2(
    password: string,
    salt: string,
    config: Config
  ): Promise<{
    rawHash: string
    encodedHash: string
  }>

  export = argon2
}
