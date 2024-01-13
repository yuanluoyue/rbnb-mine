const fs = require('fs')
const csv = require('fast-csv')
const bip39 = require('bip39')
const { ethers } = require('ethers')

const KEY_PATH = `m/44'/60'/0'/0/0`
const genCount = 20

const genWallet = () => {
  const mnemonic = bip39.generateMnemonic()
  const wallet = ethers.Wallet.fromMnemonic(mnemonic, KEY_PATH)

  return {
    地址: wallet.address,
    私钥: wallet.privateKey,
    助记词: mnemonic,
  }
}

const main = async () => {
  const walletData = []
  const filePath = 'wallets.csv'

  for (let i = 0; i < genCount; i++) {
    const w = genWallet()
    walletData.push(w)
  }

  const writableStream = fs.createWriteStream(filePath)

  csv
    .write(walletData, { headers: true })
    .pipe(writableStream)
    .on('finish', () => {
      console.log('CSV file has been written successfully.')
    })
    .on('error', err => {
      console.error('Error writing CSV file:', err)
    })
}

main()
