const net = require('net')
const csv = require('fast-csv')
const fs = require('fs')
const { ethers } = require('ethers')

const { difficulty, walletTablePath, tick } = require('../config')
const { getRandomInt, sleepMS } = require('./lib')

const PORT = 3000
const currentChallenge = ethers.utils.formatBytes32String(tick)

const connectAsync = (client, port, host) => {
  return new Promise((resolve, reject) => {
    // 尝试连接
    client.connect(port, host, () => {
      resolve() // 连接成功，Promise 解析
    })

    // 处理连接错误
    client.on('error', err => {
      reject(err) // 连接失败，Promise 拒绝
    })
  })
}

// 查找可能的solution
function findSolution(difficulty, walletInfo) {
  const { address } = walletInfo
  while (1) {
    const random_value = ethers.utils.randomBytes(32)
    const potential_solution = ethers.utils.hexlify(random_value)
    const hashed_solution = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['bytes32', 'bytes32', 'address'],
        [potential_solution, currentChallenge, address],
      ),
    )
    if (hashed_solution.startsWith(difficulty)) {
      return potential_solution
    }
  }
}

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

const main = async () => {
  const client = new net.Socket()
  const wallets = await initWallet()

  await connectAsync(client, PORT, 'localhost')

  client.on('error', err => {
    console.log('calculater', err)
  })

  client.on('end', () => {})

  while (true) {
    const index = getRandomInt(0, wallets.length - 1)
    const walletInfo = wallets[index]
    const solution = findSolution(difficulty, walletInfo)

    const message = {
      action: 'push',
      data: {
        address: walletInfo.address,
        solution,
        failCount: 0,
      },
    }

    try {
      client.write(JSON.stringify(message))
      console.log('计算完成')
    } catch (err) {
      console.log('连接异常', err)
    }

    await sleepMS(50)
  }
}

main()
