const fetch = require('node-fetch')
const csv = require('fast-csv')
const fs = require('fs')

const { sleepMS } = require('./lib')
const { walletTablePath } = require('./config')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const initWallet = async () => {
  const wallets = []
  return new Promise((resolve, reject) => {
    fs.createReadStream(walletTablePath)
      .pipe(csv.parse({ headers: true }))
      .on('error', error => reject(error))
      .on('data', row => {
        wallets.push({
          address: row['地址'],
        })
      })
      .on('end', () => resolve(wallets))
  })
}

const getBalance = async address => {
  const url = `https://ec2-18-217-135-255.us-east-2.compute.amazonaws.com/balance?address=${address}`
  const res = await fetch(url, {
    headers: {
      accept: 'application/json, text/plain, */*',
      'accept-language': 'zh-CN,zh;q=0.9',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
    },
    referrer: 'https://bnb.reth.cc/',
    referrerPolicy: 'strict-origin-when-cross-origin',
    body: null,
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
  })
  const r = await res.json()
  console.log(r)
}

const main = async () => {
  const wallets = await initWallet()

  for (const w of wallets) {
    const balance = await getBalance(w.address)
    await sleepMS(1000)
  }
}

main()
