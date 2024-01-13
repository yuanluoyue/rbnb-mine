const { ethers } = require('ethers')
const csv = require('fast-csv')
const fs = require('fs')

const { difficulty, walletTablePath, tick } = require('./config')
const { postResultData, getRandomInt, sleepMS } = require('./lib')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// const provider = new ethers.providers.JsonRpcProvider(rpcUrl)

const currentChallenge = ethers.utils.formatBytes32String(tick)

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

async function sendTransaction(solution, walletInfo) {
  const body = {
    solution,
    challenge: currentChallenge,
    address: walletInfo.address,
    difficulty,
    tick,
  }

  console.log(body)

  await postResultData(JSON.stringify(body))
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
          privateKey: row['私钥'],
        })
      })
      .on('end', () => resolve(wallets))
  })
}

async function main() {
  const wallets = await initWallet()
  try {
    while (true) {
      const index = getRandomInt(0, wallets.length - 1)
      const walletInfo = wallets[index]
      const solution = findSolution(difficulty, walletInfo)

      await sendTransaction(solution, walletInfo)
      console.log(`发送成功 solution: ${solution}`)

      await sleepMS(50)
    }
  } catch (err) {
    console.log('错误 ------------------')
    console.log(err)
    console.log('-----------------------')
    console.log('重启程序')
    main()
  }
}

main()
