import axios from 'axios'

const AVALANCHE_RPC = 'https://api.avax.network/ext/bc/C/rpc'

export async function fetchCChainBaseFee() {
  const payload = {
    jsonrpc: '2.0',
    method: 'eth_gasPrice',
    params: [],
    id: 1
  }

  try {
    const response = await axios.post(AVALANCHE_RPC, payload)
    const gasPriceWei = BigInt(response.data.result) // Gas price in wei

    // Convert wei to nAVAX (1 AVAX = 10^18 wei; 1 nAVAX = 10^9 wei)
    const gasPriceNAVAX = gasPriceWei / BigInt(1e9)
    return gasPriceNAVAX.toString()
  } catch (error) {
    console.error('Error fetching gas price:', error)
    throw error
  }
}

module.exports = { fetchCChainBaseFee }
