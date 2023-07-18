/* eslint-disable no-console */
// TODO: remove this script once glacier returns coingecko id for each contract token
const fs = require('fs')

const assetsPath = '../app/assets/'

function isEmpty(obj) {
  return Object.keys(obj).length === 0
}

// coinlistRaw.json is from https://api.coingecko.com/api/v3/coins/list?include_platform=true
fs.readFile('../coinlistRaw.json', 'utf8', (err, dataRaw) => {
  if (err) {
    console.log(`Error reading file from disk: ${err}`)
  } else {
    const data = JSON.parse(dataRaw)

    const coinByAddress = {}
    data.forEach(item => {
      if (!isEmpty(item.platforms)) {
        for (const platform in item.platforms) {
          if (
            item.platforms[platform] &&
            !coinByAddress[item.platforms[platform]]
          ) {
            coinByAddress[item.platforms[platform]] = {
              id: item.id,
              symbol: item.symbol,
              name: item.name
            }
          }
        }
      }
    })

    fs.writeFile(
      assetsPath + 'coinByAddress.json',
      JSON.stringify(coinByAddress),
      'utf8',
      // eslint-disable-next-line no-shadow
      err => {
        if (err) {
          console.log(`Error writing file: ${err}`)
        } else {
          console.log(`File is written successfully!`)
        }
      }
    )

    // const coinBySymbol = {}
    // data.forEach(item => {
    //   if (!coinBySymbol[item.symbol]) {
    //     coinBySymbol[item.symbol] = {
    //       id: item.id,
    //       symbol: item.symbol,
    //       name: item.name
    //     }
    //   }
    // })

    // fs.writeFile(
    //   assetsPath + 'coinBySymbol.json',
    //   JSON.stringify(coinBySymbol),
    //   'utf8',
    //   err => {
    //     if (err) {
    //       console.log(`Error writing file: ${err}`)
    //     } else {
    //       console.log(`File is written successfully!`)
    //     }
    //   }
    // )
  }
})
