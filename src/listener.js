const fs = require('fs')
const net = require('net')

const filePath = 'hashCache.json'
const PORT = 3000

// const solution = {
//   address: '',
//   solution: '',
//   failCount: 0,
// }

// const message = {
//   action: 'push',
//   data: {
//     address: '',
//     solution: '',
//     failCount: 0,
//   },
// }

const pushSolution = solution => {
  const data = fs.readFileSync(filePath, 'utf-8')
  const arr = JSON.parse(data)
  arr.push(solution)
  const newData = JSON.stringify(arr)
  fs.writeFileSync(filePath, newData, 'utf-8')
  console.log('当前答案数量', arr.length)
}

const popSolution = () => {
  const data = fs.readFileSync(filePath, 'utf-8')
  const arr = JSON.parse(data)
  const solution = arr.pop()
  const newData = JSON.stringify(arr)
  fs.writeFileSync(filePath, newData, 'utf-8')
  console.log('当前答案数量', arr.length)
  return solution
}

const main = () => {
  const isExist = fs.existsSync(filePath)

  if (!isExist) {
    // 创建共享文件
    fs.writeFileSync(filePath, JSON.stringify([]))
  }

  const server = net.createServer(socket => {
    socket.on('data', data => {
      try {
        const message = JSON.parse(data)
        // console.log(message)
        if (message.action === 'push') {
          pushSolution(message.data)
        } else if (message.action === 'pop') {
          const solution = popSolution()
          if (solution) {
            const reMsg = JSON.stringify(solution)
            socket.write(reMsg)
          } else {
            console.log('暂无可用答案')
            socket.write('')
          }
        }
      } catch (error) {
        console.error('Error processing data:', error)
      }
    })

    socket.on('error', err => console.log(err))
    socket.on('end', () => {})
  })

  server.on('error', err => console.log(err))

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
  })
}

main()
