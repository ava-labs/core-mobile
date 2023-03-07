/* eslint-disable @typescript-eslint/no-explicit-any */
import { utils } from '@avalabs/avalanchejs-v2'
import { Avalanche } from '@avalabs/wallets-sdk'
import {
  AddDelegatorTx,
  AddValidatorTx,
  AvalancheBaseTx,
  ExportTx
} from 'store/walletConnect/handlers/types'
import { parseAvalancheTx } from 'store/walletConnect/handlers/utils/parseAvalancheTx'

jest.mock('@avalabs/wallets-sdk', () => {
  const RealAvalanche = jest.requireActual('@avalabs/wallets-sdk')
  return {
    Avalanche: {
      ...RealAvalanche.Avalanche,
      getUnixNow: jest.fn()
    }
  }
})

const amount = BigInt(100_000_000) // 0.1 AVAX
const currentAddress = 'X-fuji1utacgpu8arf7sq0vdfh0zk0pukgfk8nyfxsh2k'

const provider = Avalanche.JsonRpcProvider.getDefaultFujiProvider()
const xApiSpy = jest.spyOn(provider, 'getApiX')

describe('src/background/services/wallet/utils/parseAvalancheTx.ts', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('returns unknown type for incorrect transactions', async () => {
    // BaseTx - currently not supported so we can use it to test the 'unknown' type
    const tx = utils.hexToBuffer(
      '00000000000000000005ab68eb1ee142a05cfe768c36e11f0b596db5a3c6c77aabe665dad9e638ca94f7000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000022fce8c000000000000000000000000100000001941bc277cbb995d20fae495b37798590bccc68d20000000237a0327ebb533e55ff18e942afdbed6de0b8ae21db8b506d5812545ae8e780d9000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000050000000023b403c00000000100000000c17d88f5896040ce72d366fca5a973a292f6aa0e52e9580bd96106370e3ea6cd000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000500000000054e08400000000100000000000000007fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000005f5e10000000000000000000000000100000001941bc277cbb995d20fae495b37798590bccc68d20000000200000009000000015a9658cc0b6a6ba06d4bb7ab562bb324cc91b332135b8a35bdaad37ba2b4feaf2d7a37579d66f0c12fad240be8914ebd3e8002c47c4e61ad512de132626a69aa0100000009000000015a9658cc0b6a6ba06d4bb7ab562bb324cc91b332135b8a35bdaad37ba2b4feaf2d7a37579d66f0c12fad240be8914ebd3e8002c47c4e61ad512de132626a69aa019881a257'
    )
    const parsed = (await parseAvalancheTx(
      tx,
      'PVM',
      provider,
      currentAddress
    )) as AddValidatorTx

    expect(parsed.type).toEqual('unknown')
    expect(parsed.chain).toEqual('PVM')
  })

  describe('PVM', () => {
    it('can add validator', async () => {
      const tx = utils.hexToBuffer(
        '00000000000c0000000500000000000000000000000000000000000000000000000000000000000000000000000000000001b67bb4bc798a2007d7992f1145eb68439d8720fe429f0f054721f42518dbd157000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000150000000063af7b8000000005000000003b9aca00000000010000000000000000f0da282bc05ba94581de6f7dded187a406f1931c00000000633b115500000000633db455000000003b9aca00000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000160000000063af7b8000000007000000003b9aca0000000000000000000000000100000001e0cfe8cae22827d032805ded484e393ce51cbedb0000000b00000000000000000000000100000001e0cfe8cae22827d032805ded484e393ce51cbedb00004e20'
      )
      const parsed = (await parseAvalancheTx(
        tx,
        'PVM',
        provider,
        currentAddress
      )) as AddValidatorTx

      expect(parsed.type).toEqual('add_validator')
      expect(parsed.nodeID).toEqual('NodeID-NxWWrAZTb7qytsHvC32Y2NfPFeKfEzW9s')
      expect(parsed.stake).toEqual(BigInt('1000000000'))
      expect(parsed.fee).toEqual(20000)
      expect(parsed.start).toEqual('1664815445')
      expect(parsed.end).toEqual('1664988245')
      expect(parsed.rewardOwner.addrs.length).toEqual(1)
      expect(parsed.rewardOwner.addrs[0]?.toString()).toEqual(
        'avax1ur873jhz9qnaqv5qthk5sn3e8nj3e0km3mqes5'
      )
    })

    it('can add delegator', async () => {
      const tx = utils.hexToBuffer(
        '00000000000e0000000500000000000000000000000000000000000000000000000000000000000000000000000000000001b67bb4bc798a2007d7992f1145eb68439d8720fe429f0f054721f42518dbd157000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000150000000063af7b8000000005000000003b9aca000000000100000000000000000155af00c95daafa2deb410c10d1331fc07fcb0700000000633b1797000000006363f617000000003b9aca00000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000160000000063af7b8000000007000000003b9aca0000000000000000000000000100000001e0cfe8cae22827d032805ded484e393ce51cbedb0000000b00000000000000000000000100000001e0cfe8cae22827d032805ded484e393ce51cbedb'
      )
      const parsed = (await parseAvalancheTx(
        tx,
        'PVM',
        provider,
        currentAddress
      )) as AddDelegatorTx

      expect(parsed.type).toEqual('add_delegator')
      expect(parsed.nodeID).toEqual('NodeID-84KbQHSDnojroCVY7vQ7u9Tx7pUonPaS')
      expect(parsed.stake).toEqual(BigInt('1000000000'))
      expect(parsed.start).toEqual('1664817047')
      expect(parsed.end).toEqual('1667495447')
      expect(parsed.rewardOwner.addrs.length).toEqual(1)
      expect(parsed.rewardOwner.addrs[0]?.toString()).toEqual(
        'avax1ur873jhz9qnaqv5qthk5sn3e8nj3e0km3mqes5'
      )
    })

    it('can export to C', async () => {
      const tx = utils.hexToBuffer(
        '000000000012000000050000000000000000000000000000000000000000000000000000000000000000000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000700000000054e084000000000000000000000000100000001941bc277cbb995d20fae495b37798590bccc68d200000002707f364a2ac517938ff1b8a0aff367e9b875fe63c4016d8c48e97fa48e5083b4000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000500000000056c8cc0000000010000000076b47b7bd8d72b8e23c442def1311b7b1e0feab6ae62f151d0e469fa41f7f5c1000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000050000000005e69ec00000000100000000000000007fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000005f5e10000000000000000000000000100000001941bc277cbb995d20fae495b37798590bccc68d2000000020000000900000001c37451594eae08ae1e488121ab97b08d552e872f4f65b61d061f085b9b34229301612eada449c9e497b57899c8d3f03e3cbd94061cba3ba06b40f9670ece5802000000000900000001c37451594eae08ae1e488121ab97b08d552e872f4f65b61d061f085b9b34229301612eada449c9e497b57899c8d3f03e3cbd94061cba3ba06b40f9670ece58020078452cc1'
      )
      const parsed = (await parseAvalancheTx(
        tx,
        'PVM',
        provider,
        currentAddress
      )) as ExportTx

      expect(parsed.type).toEqual('export')
      expect(parsed.destination).toEqual('EVM')
      expect(parsed.amount).toEqual(amount)
      expect(parsed.chain).toEqual('PVM')
    })

    it('can export to X', async () => {
      const tx = utils.hexToBuffer(
        '000000000012000000050000000000000000000000000000000000000000000000000000000000000000000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000700000000054e084000000000000000000000000100000001941bc277cbb995d20fae495b37798590bccc68d200000002707f364a2ac517938ff1b8a0aff367e9b875fe63c4016d8c48e97fa48e5083b4000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000500000000056c8cc0000000010000000076b47b7bd8d72b8e23c442def1311b7b1e0feab6ae62f151d0e469fa41f7f5c1000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000050000000005e69ec0000000010000000000000000ab68eb1ee142a05cfe768c36e11f0b596db5a3c6c77aabe665dad9e638ca94f7000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000005f5e10000000000000000000000000100000001941bc277cbb995d20fae495b37798590bccc68d20000000200000009000000018de52254b01f2b8cc77f870f9a3db6dfaee529718a34ab6fef9bd800e0a207b12d8794f55b8fdd6bc9d78b21cf0b41f7f837c59f530a1a4953f532e914bbcda00000000009000000018de52254b01f2b8cc77f870f9a3db6dfaee529718a34ab6fef9bd800e0a207b12d8794f55b8fdd6bc9d78b21cf0b41f7f837c59f530a1a4953f532e914bbcda000b5d503ff'
      )
      const parsed = (await parseAvalancheTx(
        tx,
        'PVM',
        provider,
        currentAddress
      )) as ExportTx

      expect(parsed.type).toEqual('export')
      expect(parsed.destination).toEqual('AVM')
      expect(parsed.amount).toEqual(amount)
      expect(parsed.chain).toEqual('PVM')
    })

    it('can import from C', async () => {
      const tx = utils.hexToBuffer(
        '000000000011000000050000000000000000000000000000000000000000000000000000000000000000000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000005e69ec000000000000000000000000100000001941bc277cbb995d20fae495b37798590bccc68d200000000000000007fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d500000001d6882138bc4ab4ff0c0cb8408e5efe7e3d4b1909bc8020d0e9843ea06c48fda9000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000050000000005f5e10000000001000000000000000100000009000000019f8cb852841e0e22eb99a5f0689fe6da7933bb9aececdbd3fe09a1694cf004947cf65a1241b3cce20db64226c6dbde7542f928830a4afbdf5aae4cf22ea6b51d0133cf6691'
      )
      const parsed = (await parseAvalancheTx(
        tx,
        'PVM',
        provider,
        currentAddress
      )) as ExportTx

      expect(parsed.type).toEqual('import')
      expect(parsed.amount).toEqual(amount)
      expect(parsed.chain).toEqual('PVM')
      expect((parsed as any).source).toEqual('EVM')
    })

    it('can import from X', async () => {
      const tx = utils.hexToBuffer(
        '0x000000000011000000050000000000000000000000000000000000000000000000000000000000000000000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000005e69ec000000000000000000000000100000001941bc277cbb995d20fae495b37798590bccc68d20000000000000000ab68eb1ee142a05cfe768c36e11f0b596db5a3c6c77aabe665dad9e638ca94f700000001b421a9218f66c835725980dcf6c0ee0776095443e9c8cee3c7b94085c90d848e000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000050000000005f5e1000000000100000000000000010000000900000001432a4d45302bec14df799df8a7515190e2b88e568761cef477779b6b0aa4ba7b3b29f7dbbd551d55524f7abdf2b1d7ebd616700a4bf531a4b4683a1765580d5e01c2fca9c9'
      )
      const parsed = (await parseAvalancheTx(
        tx,
        'PVM',
        provider,
        currentAddress
      )) as ExportTx

      expect(parsed.type).toEqual('import')
      expect(parsed.amount).toEqual(amount)
      expect(parsed.chain).toEqual('PVM')
      expect((parsed as any).source).toEqual('AVM')
    })
  })

  describe('AVM', () => {
    it('can export to C', async () => {
      const tx = utils.hexToBuffer(
        '00000000000400000005ab68eb1ee142a05cfe768c36e11f0b596db5a3c6c77aabe665dad9e638ca94f7000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000022fce8c000000000000000000000000100000001941bc277cbb995d20fae495b37798590bccc68d20000000237a0327ebb533e55ff18e942afdbed6de0b8ae21db8b506d5812545ae8e780d9000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000050000000023b403c00000000100000000c17d88f5896040ce72d366fca5a973a292f6aa0e52e9580bd96106370e3ea6cd000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000500000000054e08400000000100000000000000007fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000005f5e10000000000000000000000000100000001941bc277cbb995d20fae495b37798590bccc68d20000000200000009000000015a9658cc0b6a6ba06d4bb7ab562bb324cc91b332135b8a35bdaad37ba2b4feaf2d7a37579d66f0c12fad240be8914ebd3e8002c47c4e61ad512de132626a69aa0100000009000000015a9658cc0b6a6ba06d4bb7ab562bb324cc91b332135b8a35bdaad37ba2b4feaf2d7a37579d66f0c12fad240be8914ebd3e8002c47c4e61ad512de132626a69aa019881a257'
      )
      const parsed = (await parseAvalancheTx(
        tx,
        'AVM',
        provider,
        currentAddress
      )) as ExportTx

      expect(parsed.type).toEqual('export')
      expect(parsed.destination).toEqual('EVM')
      expect(parsed.amount).toEqual(amount)
      expect(parsed.chain).toEqual('AVM')
    })

    it('can export to P', async () => {
      const tx = utils.hexToBuffer(
        '00000000000400000005ab68eb1ee142a05cfe768c36e11f0b596db5a3c6c77aabe665dad9e638ca94f7000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000700000000055d4a8000000000000000000000000100000001941bc277cbb995d20fae495b37798590bccc68d2000000016dfcec3d4b6b43425eaef2cf48827824c38be072557827beb9f75987803b0ec5000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000005000000000b626dc00000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000005f5e10000000000000000000000000100000001941bc277cbb995d20fae495b37798590bccc68d20000000100000009000000017b1e1bf5397255fb1f74a949861026242d5573bcd9a8381a4c31d5214276382332a3e40dbbe45af194b5ab92f366aa3c0547f3a159fefd5f0a8b0603fd30719f00c90d848e'
      )
      const parsed = (await parseAvalancheTx(
        tx,
        'AVM',
        provider,
        currentAddress
      )) as ExportTx

      expect(parsed.type).toEqual('export')
      expect(parsed.destination).toEqual('PVM')
      expect(parsed.amount).toEqual(amount)
      expect(parsed.chain).toEqual('AVM')
    })

    it('can import from C', async () => {
      const tx = utils.hexToBuffer(
        '00000000000300000005ab68eb1ee142a05cfe768c36e11f0b596db5a3c6c77aabe665dad9e638ca94f7000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000005e69ec000000000000000000000000100000001941bc277cbb995d20fae495b37798590bccc68d200000000000000007fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d50000000101d6d8c81ecb631f533d7a59ac438c55f81685c223644003c4a1c3e2cb321e34000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000050000000005f5e1000000000100000000000000010000000900000001dc9f03afabe0c18916d6cc1cc504ec1e3dc3f37d2c987423c6b06f3f6cc0d3e9372fd887bdeeddd344a33294706f859c0a2d5bbab073b4582e7eb9e85705be3b01e4eddb53'
      )
      const parsed = (await parseAvalancheTx(
        tx,
        'AVM',
        provider,
        currentAddress
      )) as ExportTx

      expect(parsed.type).toEqual('import')
      expect(parsed.amount).toEqual(amount)
      expect(parsed.chain).toEqual('AVM')
      expect((parsed as any).source).toEqual('EVM')
    })

    it('can import from P', async () => {
      const tx = utils.hexToBuffer(
        '00000000000300000005ab68eb1ee142a05cfe768c36e11f0b596db5a3c6c77aabe665dad9e638ca94f7000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000005e69ec000000000000000000000000100000001941bc277cbb995d20fae495b37798590bccc68d200000000000000000000000000000000000000000000000000000000000000000000000000000000000000016fa351adf368204c87bc1e2afe1b37c5a2ea14de39e6a2a58805e338b5d503ff000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000050000000005f5e1000000000100000000000000010000000900000001f8ceaf7b2f11bd8126bc9bfb978ccecc8fdf559087bf601c9788b353dbfbc78907c07829806181a1b89b6183b26a7da0317d774d44b731e0f349807b8d24d7250143ceb54d'
      )
      const parsed = (await parseAvalancheTx(
        tx,
        'AVM',
        provider,
        currentAddress
      )) as ExportTx

      expect(parsed.type).toEqual('import')
      expect(parsed.amount).toEqual(amount)
      expect(parsed.chain).toEqual('AVM')
      expect((parsed as any).source).toEqual('PVM')
    })

    // https://explorer-xp.avax-test.network/tx/HdcvhFEEVLAtLkXT6rdcCwaBhEnLJosUeCzb86Tm2vVawN8yc
    it('can parse baseTx', async () => {
      ;(Avalanche.getUnixNow as jest.Mock).mockReturnValue(0n)

      const getAssetDescriptionMock =
        (assetID: string, name: string, symbol: string, denomination: number) =>
        () => ({
          assetID,
          name,
          symbol,
          denomination
        })

      const tx = utils.hexToBuffer(
        '00000000000000000005ab68eb1ee142a05cfe768c36e11f0b596db5a3c6c77aabe665dad9e638ca94f700000006070041f80805a44c08c4ae52d07408e39dce80ca9731f92857a6a298c21072260000000700000000000186a0000000000000000000000001000000017373fa2c08edbd4d8a6c6c92b116861ed0b354c2070041f80805a44c08c4ae52d07408e39dce80ca9731f92857a6a298c21072260000000700000000000c350000000000000000000000000100000001e2fb840787e8d3e801ec6a6ef159e1e5909b1e643d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000005f5e100000000000000000000000001000000017373fa2c08edbd4d8a6c6c92b116861ed0b354c23d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000700000000296cdbc000000000000000000000000100000001e2fb840787e8d3e801ec6a6ef159e1e5909b1e64cbc3b3ea41c2177287f3c7d55427c0a33ba52eae7b4d8bcac4bbf39aa3f320ea000000070000000000989680000000000000000000000001000000017373fa2c08edbd4d8a6c6c92b116861ed0b354c2cbc3b3ea41c2177287f3c7d55427c0a33ba52eae7b4d8bcac4bbf39aa3f320ea000000070000000004c4b40000000000000000000000000100000001e2fb840787e8d3e801ec6a6ef159e1e5909b1e640000000342195f014650e5e0ca8a0ae9f3d7c62a1ac4983f9f2b45093465f9920953132100000001070041f80805a44c08c4ae52d07408e39dce80ca9731f92857a6a298c21072260000000500000000000dbba0000000010000000042195f014650e5e0ca8a0ae9f3d7c62a1ac4983f9f2b45093465f99209531321000000033d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000005000000002f71ff00000000010000000042195f014650e5e0ca8a0ae9f3d7c62a1ac4983f9f2b45093465f9920953132100000005cbc3b3ea41c2177287f3c7d55427c0a33ba52eae7b4d8bcac4bbf39aa3f320ea0000000500000000055d4a8000000001000000000000001148656c6c6f20506c617967726f756e642100000003000000090000000114ae54e6092f0c08a372eecdcb5b47157f38dab945dbc97b6ce7e9d64971b9275d5be6aa282ba87a3585369915c120fa00a9150d5ba0b38d02a4a79703ca9e8b01000000090000000114ae54e6092f0c08a372eecdcb5b47157f38dab945dbc97b6ce7e9d64971b9275d5be6aa282ba87a3585369915c120fa00a9150d5ba0b38d02a4a79703ca9e8b01000000090000000114ae54e6092f0c08a372eecdcb5b47157f38dab945dbc97b6ce7e9d64971b9275d5be6aa282ba87a3585369915c120fa00a9150d5ba0b38d02a4a79703ca9e8b0160b7ac53'
      )

      xApiSpy.mockReturnValue({
        getAssetDescription: jest
          .fn()
          .mockImplementationOnce(
            getAssetDescriptionMock('1', 'test token1', 'tt1', 1)
          )
          .mockImplementationOnce(
            getAssetDescriptionMock('2', 'test token2', 'tt2', 9)
          )
          .mockImplementationOnce(
            getAssetDescriptionMock('3', 'test token3', 'tt3', 18)
          )
      } as any)

      const parsed = (await parseAvalancheTx(
        tx,
        'AVM',
        provider,
        currentAddress
      )) as AvalancheBaseTx

      expect(parsed.type).toEqual('base')
      expect(parsed.chain).toEqual('AVM')
      expect(parsed.txFee).toEqual(provider.getContext().baseTxFee)
      expect(parsed.memo).toEqual('Hello Playground!')
      expect(parsed.outputs).toStrictEqual([
        {
          amount: 100000n,
          owners: ['X-fuji1wdel5tqgak75mznvdjftz95xrmgtx4xzz2jv02'],
          assetDescription: {
            assetID: '1',
            name: 'test token1',
            symbol: 'tt1',
            denomination: 1
          },
          assetId: '45qDYzqato4ah7M84qcgkpcDgj6k5EHs5EgTM2nspXDUZohGw',
          isAvax: false,
          threshold: 1n,
          locktime: 0n
        },
        {
          amount: 100000000n,
          owners: ['X-fuji1wdel5tqgak75mznvdjftz95xrmgtx4xzz2jv02'],
          assetDescription: {
            assetID: '2',
            name: 'test token2',
            symbol: 'tt2',
            denomination: 9
          },
          assetId: 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK',
          isAvax: true,
          threshold: 1n,
          locktime: 0n
        },
        {
          amount: 10000000n,
          owners: ['X-fuji1wdel5tqgak75mznvdjftz95xrmgtx4xzz2jv02'],
          assetDescription: {
            assetID: '3',
            name: 'test token3',
            symbol: 'tt3',
            denomination: 18
          },
          assetId: '2Yjtc8UshTyZjQ1E3scS4u9xENJ3sLvNTfW5AwLfbMVZLszAQR',
          isAvax: false,
          threshold: 1n,
          locktime: 0n
        }
      ])
    })
  })

  describe('EVM', () => {
    it('can export to X', async () => {
      const tx = utils.hexToBuffer(
        '000000000001000000057fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5ab68eb1ee142a05cfe768c36e11f0b596db5a3c6c77aabe665dad9e638ca94f7000000017878dda6248620181695e1f9845b9f4945c0a8d40000000005fa29ae3d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000000000037000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000005f5e10000000000000000000000000100000001941bc277cbb995d20fae495b37798590bccc68d2000000010000000900000001564f6702a8ac49165260343ea1ab2d95f6e6a4bfbf9c5f1a837bea2a13572d481f6bdf7a1448d1fa8f4dd87ab87e8d4b4647cdafe62fe841b5c09991326fe67e01c54113a7'
      )
      const parsed = (await parseAvalancheTx(
        tx,
        'EVM',
        provider,
        currentAddress
      )) as ExportTx

      expect(parsed.type).toEqual('export')
      expect(parsed.destination).toEqual('AVM')
      expect(parsed.amount).toEqual(amount)
      expect(parsed.chain).toEqual('EVM')
    })

    it('can export to P', async () => {
      const tx = utils.hexToBuffer(
        '000000000001000000057fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d50000000000000000000000000000000000000000000000000000000000000000000000017878dda6248620181695e1f9845b9f4945c0a8d40000000005fa29ae3d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000000000037000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000005f5e10000000000000000000000000100000001941bc277cbb995d20fae495b37798590bccc68d20000000100000009000000016f65bcd301a885026c5f19661737622b8d7724b56899d6851be91dd6f5ae1d4458fc77348a359053973ec0f2f8f8019b861b8c41bb5b0c18918fe0e7c2d00c43016c48fda9'
      )
      const parsed = (await parseAvalancheTx(
        tx,
        'EVM',
        provider,
        currentAddress
      )) as ExportTx

      expect(parsed.type).toEqual('export')
      expect(parsed.destination).toEqual('PVM')
      expect(parsed.amount).toEqual(amount)
      expect(parsed.chain).toEqual('EVM')
    })

    it('can import from X', async () => {
      const tx = utils.hexToBuffer(
        '000000000000000000057fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5ab68eb1ee142a05cfe768c36e11f0b596db5a3c6c77aabe665dad9e638ca94f7000000010726d395b8893f467155f12cd39c546aa024d67af5f5cb3bd6c4b4f89881a257000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000050000000005f5e1000000000100000000000000017878dda6248620181695e1f9845b9f4945c0a8d40000000005f198523d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000010000000900000001dea4c56be80a79e1d1fddfd0792e69fe65a0076056299104a90d1c01b91441c92101220f909e426e158a9b1f4eaa363c7fbf7b6570e0cef90802b05121d2587601788124ec'
      )
      const parsed = (await parseAvalancheTx(
        tx,
        'EVM',
        provider,
        currentAddress
      )) as ExportTx

      expect(parsed.type).toEqual('import')
      expect(parsed.amount).toEqual(amount)
      expect(parsed.chain).toEqual('EVM')
      expect((parsed as any).source).toEqual('AVM')
    })

    it('can import from P', async () => {
      const tx = utils.hexToBuffer(
        '000000000000000000057fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d50000000000000000000000000000000000000000000000000000000000000000000000013304d1dba6ca37c9b7c1f87bb649303fd6017205f1eb77586c86461a07bc2902000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000050000000005f5e1000000000100000000000000017878dda6248620181695e1f9845b9f4945c0a8d40000000005f198523d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000010000000900000001eb6b830dac66610bd408c4c08e4a6b173cd9ef23b0e8e725e1fc20bcd3b38fa92bcd4f04b0555968e1ce78ed9e5ecefe819edbbd889786365c92d625059748cb001e61405c'
      )
      const parsed = (await parseAvalancheTx(
        tx,
        'EVM',
        provider,
        currentAddress
      )) as ExportTx

      expect(parsed.type).toEqual('import')
      expect(parsed.amount).toEqual(amount)
      expect(parsed.chain).toEqual('EVM')
      expect((parsed as any).source).toEqual('PVM')
    })
  })
})
