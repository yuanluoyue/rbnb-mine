const net = require('net')
const { ethers } = require('ethers')

const { postResultData, sleepMS } = require('./lib')
const { difficulty, tick } = require('../config')

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

async function sendTransaction(solution, walletInfo) {
  const body = {
    solution,
    challenge: currentChallenge,
    address: walletInfo.address,
    difficulty,
    tick,
  }

  const res = await postResultData(JSON.stringify(body))
  return res
}

const main = async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  const client = new net.Socket()
  try {
    await connectAsync(client, PORT, 'localhost')
  } catch (err) {
    await sleepMS(2000)
    console.log('重新连接 linstener')
    main()
    return
  }

  client.on('error', err => {
    console.log(err)
  })

  client.on('end', () => {})

  while (true) {
    try {
      const message = {
        action: 'pop',
      }

      client.write(JSON.stringify(message))

      const data = await new Promise(resolve => {
        client.once('data', resolve)
      })

      if (data) {
        const d = JSON.parse(data)
        try {
          console.log('开始发送')
          const res = await sendTransaction(d.solution, { address: d.address })
          console.log('res', res)
          if (res.msg.includes('success')) {
            console.log('请求成功')
          } else {
            console.error('!!! 未知原因 关注')
            throw Error('')
          }
        } catch (err) {
          console.log('#2 err', err)
          console.log('对方服务异常，回收答案')
          const msg = {
            action: 'push',
            data: {
              address: d.address,
              solution: d.solution,
              failCount: d.failCount + 1,
            },
          }
          if (msg.data.failCount < 6) {
            client.write(JSON.stringify(msg))
          }
        }
      }
    } catch (err) {
      console.log('#1 err', err)
    }

    await sleepMS(500)
  }
}

main()
